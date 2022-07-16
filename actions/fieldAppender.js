import withFlushSync from './withFlushSync.js';

/**
 * Helper function to create a mergeState function that appends and item to an array property
 * @param {String|Number} propName  The name of the array property to append to
 * @return {Function}  A function suitable for a store action
 */
export function fieldAppender(propName) {
  return function updater(...newItems) {
    return this.mergeState(old => ({
      [propName]: [...old[propName], ...newItems],
    }));
  };
}

/**
 * Helper function to create a mergeSync function that appends and item to an array property synchronously
 * @param {String|Number} propName  The name of the array property to append to
 * @return {Function}  A function suitable for a store action
 */
export const fieldAppenderSync = withFlushSync(fieldAppender);
