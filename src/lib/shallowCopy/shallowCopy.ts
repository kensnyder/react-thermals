/**
 * Copy a value shallowly
 * @param value  Any value, but often an object
 * @return  A copy of the value
 */
export default function shallowCopy(value: any): any {
  if (!value || typeof value === 'string') {
    // falsy scalar or a string
    return value;
  } else if (typeof value[Symbol.iterator] === 'function') {
    // e.g. Set, Array, DOMNodeList, etc
    return [...value];
  } else if (typeof value === 'object') {
    return { ...value };
  }
  // other scalar values are always passed by value
  return value;
}
