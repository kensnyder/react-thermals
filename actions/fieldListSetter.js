import withFlushSync from './withFlushSync.js';
import { deepUpdater } from '../src/deepUpdater/deepUpdater.js';

/**
 * Helper function to create a setState function that directly sets one or more properties
 * @param {String} path  The name of or path to the object with values to set
 * @param {String[]|Number[]} fieldNames  The name of the properties to merge
 * @return {Function}  A function suitable for a store action
 */
export function fieldListSetter(path, fieldNames) {
  const set = deepUpdater(path, function setter(copy, ...values) {
    let i = 0;
    for (const field of fieldNames) {
      copy[field] = values[i++];
    }
    return copy;
  });
  return function updater(...newValues) {
    this.setState(old => set(old, ...newValues));
  };
}

/**
 * Run fieldListSetter and then flush pending state changes
 * @param {String} path  The name of or path to the object with values to set
 * @param {String[]|Number[]} propNames  The name of the properties to merge
 * @return {Function}  A function suitable for a store action
 */
export const fieldListSetterSync = withFlushSync(fieldListSetter);
