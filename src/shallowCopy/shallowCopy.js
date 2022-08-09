/**
 * Copy a value shallowly
 * @param {*} value  Any value, but often an object
 * @return {*}  A copy of the value
 */
export default function shallowCopy(value) {
  if (!value) {
    // falsy scalar
    return value;
  } else if (value instanceof Map) {
    return new Map(value);
  } else if (value instanceof Set) {
    return new Set(value);
  } else if (typeof value[Symbol.iterator] === 'function') {
    return [...value];
  } else if (typeof value === 'object') {
    return { ...value };
  }
  // other scalar value
  return value;
}
