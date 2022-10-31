import withFlushSync from './withFlushSync.js';
import { updatePath } from '../src/updatePath/updatePath.js';

/**
 * Helper function to create a setState function that adds the given amount
 * e.g. use amount = 1 to create an incrementer function and amount = -1 for a decremeter function
 * @param {String} path  The name of or path to the value to set
 * @return {Function}  A function suitable for a store action
 */
export function fieldAdder(path, baseAmount = 0) {
  const add = updatePath(path, function adder(old, totalAmount) {
    return old + totalAmount;
  });
  return function updater(amount = 0) {
    return this.setState(old => add(old, baseAmount + amount));
  };
}

/**
 * Run fieldAdder and then flush pending state changes
 * e.g. use amount = 1 to create an incrementer function and amount = -1 for a decremeter function
 * @param {String} path  The name of or path to the property to toggle
 * @return {Function}  A function suitable for a store action
 */
export const fieldAdderSync = withFlushSync(fieldAdder);
