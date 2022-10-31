import withFlushSync from './withFlushSync.js';
import { updatePath } from '../src/updatePath/updatePath.js';

/**
 * Helper function to create a mergeState function that appends and item to an array property
 * @param {String} path  The name of or path to the array property to append to
 * @return {Function}  A function suitable for a store action
 */
export function appender(path) {
  const append = updatePath(path, (old, newItems) => {
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
export const appenderSync = withFlushSync(appender);
