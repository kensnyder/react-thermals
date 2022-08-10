import withFlushSync from './withFlushSync.js';
import { deepUpdater } from './deepUpdater.js';

/**
 * Helper function to create a mergeState function that removes the given item from an array property
 * @param {String|Number} propName  The name of the array property to remove from
 * @return {Function}  A function suitable for a store action
 */
export function fieldRemover(path) {
  const remove = deepUpdater(path, function remover(old, items) {
    return old?.filter(value => !items.includes(value));
  });
  return function updater(...itemsToRemove) {
    return this.setState(old => remove(old, itemsToRemove));
  };
}

/**
 * Helper function to create a mergeSync function that removes the given item from an array property synchronously
 * @param {String|Number} propName  The name of the array property to remove from
 * @return {Function}  A function suitable for a store action
 */
export const fieldRemoverSync = withFlushSync(fieldRemover);
