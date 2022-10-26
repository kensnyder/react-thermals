import withFlushSync from './withFlushSync.js';
import { deepUpdater } from '../src/deepUpdater/deepUpdater.js';

/**
 * Helper function to create a mergeState function that appends and item to an array property
 * @param {String} path  The name of or path to the array property to append to
 * @return {Function}  A function suitable for a store action
 */
export function fieldAppender(path) {
  const append = deepUpdater(path, (old, newItems) => {
    return [...old, ...newItems];
  });
  return function updater(...newItems) {
    return this.setState(old => append(old, newItems));
  };
}

/**
 * Helper function to create a mergeSync function that appends and item to an array property synchronously
 * @param {String|Number} propName  The name of the array property to append to
 * @return {Function}  A function suitable for a store action
 */
export const fieldAppenderSync = withFlushSync(fieldAppender);
