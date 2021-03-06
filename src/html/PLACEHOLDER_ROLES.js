/**
 * Enum for variants of usage for placeholders used instead of template literal parameters (expressions).
 *
 * @memberOf module:html
 * @const
 * @alias PLACEHOLDER_ROLES
 * @enum {Symbol}
 */
export default {

  /**
   * Expression placed instead of tag name (like `<${expr}></${expr}>`).
   */
  TAG_NAME: 0,

  /**
   * Disambiguation (role not detected precisely yet): expression placed instead of tag attribute (like
   * `<my-component ${expr}>...`) or tag attribute name (like `<my-component ${expr}="123">`).
   */
  ATTRIBUTE_OR_ATTRIBUTE_NAME: 1,

  /**
   * Expression placed instead of whole attribute value: `<my-component attr="${expr}">`.
   */
  ATTRIBUTE_VALUE: 2,

  /**
   * Expression placed instead of part of attribute name or attribute value: `<my-component attr-${expr}="123">...` or
   * `<my-component attr="123-${expr}">...`.
   */
  PART_OF_ATTRIBUTE_OR_VALUE: 3,


  /**
   * Expression is placed instead of attribute name and attribute has no value: `<my-component ${expr}>...`.
   */
  ATTRIBUTE: 4,

  /**
   * Expression is placed instead of tag attribute name (like `<my-component ${expr}="123">`).
   */
  ATTRIBUTE_NAME: 5,

  /**
   * Expression is placed inside of other tag (or root element): `<my-component>${expr}</my-component>`
   */
  TAG: 6,
};
