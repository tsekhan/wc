/** @module HtmlComponent */

import getAllPropertyNames from './getAllPropertyNames';
import getPropertyDescriptor from './getPropertyDescriptor';
import registerClass from '../../registerClass';
import { isIterable, isString } from '../../utils';
import Ref from '../../Ref';
import nodeRegistry from '../../nodeRegistry';
import $ from '../$';

const DEFAULT_TAG = 'cmp-tc';

/**
 * Base class to be extended to build custom HTML component. HTML node by itself.
 *
 * @memberOf module:HtmlComponent
 * @alias HtmlComponent
 */
export default class HtmlComponent {

  /**
   * @constructs HtmlComponent
   * @param {object} [params] - Associative array (Object) with objects to be assigned as instance properties.
   * @param {Iterable} [children] - Child nodes for current node.
   * @returns {HTMLElement}
   */
  constructor(params, children) {
    const Class = Object.getPrototypeOf(this).constructor;

    /**
     * Tag name of HTML element created after instantiation.
     *
     * @memberOf HtmlComponent
     * @name tag
     * @type {string}
     * @default component-tc
     */
    const tag = Class.tag || DEFAULT_TAG;

    if (tag.includes('-') && !nodeRegistry.has(tag)) {
      registerClass(Class, tag);
    }

    const rootElement = document.createElement(tag);

    const shadowRoot = rootElement.attachShadow({ mode: 'open' });

    const binders = new Map();

    Object.defineProperty(rootElement, 'template',

      /**
       * Shadow root template for instantiated component.
       *
       * @memberOf HtmlComponent
       * @name template
       * @type {string}
       */
      {
        set: template => {
          while (shadowRoot.firstChild) {
            shadowRoot.removeChild(shadowRoot.firstChild);
          }

          if (isString(template)) {
            shadowRoot.innerHTML = template;
          } else if (isIterable(template)) {
            Array.from(template)
              .forEach(templateItem => shadowRoot.appendChild(templateItem));
          } else {
            shadowRoot.appendChild(template);
          }
        },

        get: () => {
          const children = shadowRoot.childNodes;

          return children.length < 2 ? children[0] : children;
        },
      });

    if (Class.template !== undefined) {
      rootElement.template = Class.template;
    }

    rootElement.$ = new Proxy({}, {
      get: (oTarget, sKey) => {
        if (!binders.has(sKey)) {
          binders.set(sKey, new $(rootElement[sKey]));
        }

        return binders.get(sKey);
      },
    });

    const rootElementMixin = {};

    const artificialPrototype = new Proxy({}, {
      getPrototypeOf: () => rootElementMixin,

      setPrototypeOf: (target, prototype) =>
        Object.setPrototypeOf(rootElementMixin, prototype),

      isExtensible: () => Object.isExtensible(rootElementMixin),

      preventExtensions: oTarget => {
        // TODO Check why we need to do both
        Object.preventExtensions(oTarget);
        Object.preventExtensions(rootElementMixin);

        return !Object.isExtensible(rootElementMixin);
      },

      getOwnPropertyDescriptor: (oTarget, sKey) =>
        Object.getOwnPropertyDescriptor(rootElementMixin, sKey),

      defineProperty: (oTarget, sKey, oDesc) => {
        Object.defineProperty(oTarget, sKey, oDesc);
        const newDesc = { ...oDesc };

        if (oDesc.get) {
          newDesc.get = oDesc.get.bind(rootElement);
        }

        return Object.defineProperty(rootElementMixin, sKey, newDesc);
      },

      has: (oTarget, sKey) => sKey in rootElementMixin,

      get: (oTarget, sKey) => rootElementMixin[sKey],

      set: (oTarget, sKey, vValue) => {
        let newValue = vValue;

        if (vValue instanceof $) {
          newValue = vValue.value;

          vValue.registerCallback(() => {
            rootElementMixin[sKey] = vValue.value;

            if (binders.has(sKey)) {
              binders.get(sKey).value = vValue.value;
            }
          });
        }

        try {
          // XXX Attribute `style` (and, probably some other) can't be set as a property but can be assigned
          //  as an attribute. If next line throws an exception - it tried to assign such property.
          rootElementMixin[sKey] = newValue;
        } catch (e) {
        }

        rootElement.setAttribute(sKey, String(newValue));

        if (binders.has(sKey)) {
          binders.get(sKey).value = newValue;
        }

        return true;
      },

      deleteProperty: (oTarget, sKey) => delete rootElementMixin[sKey],

      ownKeys: () => Object.getOwnPropertyNames(rootElementMixin),
    });

    Object.setPrototypeOf(rootElementMixin, Object.getPrototypeOf(this));

    getAllPropertyNames(rootElement)
      .forEach(propertyName => {
        if (!(propertyName in this)) {
          Object.defineProperty(artificialPrototype,
            propertyName,
            getPropertyDescriptor(rootElement, propertyName));
        }
      });

    Object.setPrototypeOf(rootElement, artificialPrototype);

    if (children) {
      Array.from(children)
        .forEach(child => rootElement.appendChild(child));
    }

    if (params) {
      Object.assign(rootElement, params);

      if (params.ref && params.ref instanceof Ref) {
        params.ref.node = rootElement;
      }
    }

    return rootElement;
  }
}
