/**
 * Build a function that accepts a value or a setState handler that receives
 *   the old state value and returns the new state value. Used by updatePath
 * @param transform  Some examples:
 *   Add one to the old state: getUpdateRunner(old => old + 1)
 *   Add to the old state: getUpdateRunner((old, addend) => old + addend)
 *   Append an item: getTranformerRunner((old, newItem) => ([...old, newItem]))
 *   Allow transforming later: getUpdateRunner(undefined)
 * @return A function that will update state
 * @throws {Error} if transform is not a valid type
 */
export default function getUpdateRunner(
  transform: Function | Function[] | undefined
): Function {
  if (
    Array.isArray(transform) &&
    transform.every(t => typeof t === 'function')
  ) {
    // run each transform function in sequence
    return function pipeTransforms(old: any, ...args: any[]) {
      let newVal = old;
      for (const fn of transform) {
        newVal = fn(newVal, ...args);
      }
      return newVal;
    };
  } else if (typeof transform === 'function') {
    // run transform directly
    return function runTransform(old: any, newValue: any, ...args: any[]) {
      if (typeof newValue === 'function') {
        newValue = newValue(old, ...args);
      }
      return transform(old, newValue, ...args);
    };
  } else if (transform === undefined) {
    // transform is an object or primitive: ignore the old value and always
    // use the new value. Or if new value is a function, use it to transform
    // the old value
    return function setValue(old: any, newValue: any) {
      return typeof newValue === 'function' ? newValue(old) : newValue;
    };
  } else {
    /* istanbul ignore next */
    throw new Error(
      'react-thermals: updatePath(path,transform) - transform must be a function, an array of functions or undefined'
    );
  }
}
