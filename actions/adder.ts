import withFlushSync from './withFlushSync';
import { updatePath } from '../src/updatePath/updatePath';

/**
 * Helper function to create a setState function that adds the given amount
 * @param {String} path  The name of or path to the value to set
 * @param {Number} baseAmount  A base amount to add
 *   e.g. use amount = 1 to create an incrementer function and amount = -1 for a decremeter function
 * @return {Function}  A function suitable for a store action
 */
export function adder(path, baseAmount = 0) {
  const add = updatePath(path, function addHandler(old, totalAmount) {
    return old + totalAmount;
  });
  return function updater(amount = 0) {
    return this.setState(old => add(old, baseAmount + amount));
  };
}

/**
 * Run adder and then flush pending state changes
 * e.g. use amount = 1 to create an incrementer function and amount = -1 for a decremeter function
 * @param {String} path  The name of or path to the property to toggle
 * @return {Function}  A function suitable for a store action
 */
export const adderSync = withFlushSync(adder);
