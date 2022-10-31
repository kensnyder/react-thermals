import withFlushSync from './withFlushSync.js';
import { updatePath } from '../src/updatePath/updatePath.js';

/**
 * Build a setState function that removes the given item(s) from an array
 * @param {String} path  The name of or path to the property to update
 * @return {Function}  A function suitable for a store action
 */
export function remover(path) {
  const remove = updatePath(path, function remover(old, itemsToRemove) {
    if (!old || !Array.isArray(old)) {
      return old;
    }
    return old.filter(value => !itemsToRemove.includes(value));
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
export const removerSync = withFlushSync(remover);
