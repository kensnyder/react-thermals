import withFlushSync from './withFlushSync.js';

/**
 * Helper function to create a mergeState function that removes the given item from an array property
 * @param {String|Number} propName  The name of the array property to remove from
 * @return {Function}  A function suitable for a store action
 */
export function fieldRemover(propName) {
  return function updater(...itemsToRemove) {
    return this.mergeState(old => ({
      [propName]: old[propName]?.filter(val => !itemsToRemove.includes(val)),
    }));
  };
}

/**
 * Helper function to create a mergeSync function that removes the given item from an array property synchronously
 * @param {String|Number} propName  The name of the array property to remove from
 * @return {Function}  A function suitable for a store action
 */
export const fieldRemoverSync = withFlushSync(fieldRemover);
