import isFunction from '../isFunction/isFunction';
import isArray from '../isArray/isArray';

/**
 * Build a function that accepts a value or a setState handler that receives
 *   the old state value and returns the new state value. Used by updatePath
 * @param transform  Some examples:
 *   Add one to the old state: getUpdateRunner(old => old + 1)
 *   Add to the old state: getUpdateRunner((old, addend) => old + addend)
 *   Append an item: getUpdateRunner((old, newItem) => ([...old, newItem]))
 *   Allow transforming later: getUpdateRunner(undefined)
 * @return A function that will update state
 * @throws  If transform is not a valid type
 */
export default function getUpdateRunner(
  transform: Function | Function[] | undefined = undefined
): Function {
  if (isFunction(transform)) {
    // run transform directly
    return function runTransform(old: any, newValue: any, ...args: any[]) {
      if (isFunction(newValue)) {
        old = newValue(old, ...args);
      }
      return transform(old, newValue, ...args);
    };
  } else if (isArray(transform) && transform.every(isFunction)) {
    // run each transform function in sequence
    return function pipeTransforms(old: any, ...args: any[]) {
      let newVal = old;
      for (const fn of transform) {
        newVal = fn(newVal, ...args);
      }
      return newVal;
    };
  } else if (transform === undefined) {
    // transform is an object or primitive: ignore the old value and always
    // use the new value. Or if new value is a function, use it to transform
    // the old value
    return defaultTransform;
  } else {
    /* istanbul ignore next @preserve */
    throw new Error(
      'react-thermals: updatePath(path,transform) - transform must be a function, an array of functions or undefined'
    );
  }
}

function defaultTransform(old: any, newValue: any) {
  return isFunction(newValue) ? newValue(old) : newValue;
}
