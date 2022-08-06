/**
 * Copy a value shallowly
 * @param {*} value  Any value, but often an object
 * @return {*}  A copy of the value
 */
export default function shallowCopy(value) {
  if (value instanceof Map) {
    return new Map(value);
  } else if (value instanceof Set) {
    return new Set(value);
  } else if (Array.isArray(value)) {
    return [...value];
  } else if (value && typeof value === 'object') {
    return { ...value };
  }
  // scalar value
  return value;
}
