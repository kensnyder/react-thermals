import withFlushSync from './withFlushSync.js';

/**
 * Helper function to create a mergeState function that adds the given amount to one property
 * e.g. use amount = 1 to create an incrementer function and amount = -1 for a decremeter function
 * @param {String|Number} propName  The name of the property to toggle
 * @return {Function}  A function suitable for a store action
 */
export function fieldAdder(propName, amount = null) {
  return function updater(overrideAmount = 0) {
    const finalAmount = amount === null ? overrideAmount : amount;
    return this.mergeState(old => ({
      [propName]: old[propName] + finalAmount,
    }));
  };
}

/**
 * Helper function to create a mergeSync function that adds the given amount to one property synchronously
 * e.g. use amount = 1 to create an incrementer function and amount = -1 for a decremeter function
 * @param {String|Number} propName  The name of the property to toggle
 * @return {Function}  A function suitable for a store action
 */
export const fieldAdderSync = withFlushSync(fieldAdder);
