import withFlushSync from '../withFlushSync/withFlushSync';
import { updatePath } from '../../class/updatePath/updatePath';
import Store from '../../class/Store/Store';

/**
 * Build a setState function that removes the given item(s) from an array
 * @param {String} path  The name of or path to the property to update
 * @return {Function}  A function suitable for a store action
 */
export function remover(path: string) {
  const remove = updatePath(
    path,
    function remover(old: any, itemsToRemove: any[]) {
      if (!old || !Array.isArray(old)) {
        return old;
      }
      return old.filter(value => !itemsToRemove.includes(value));
    }
  );
  return function updater(this: Store, ...itemsToRemove: any[]) {
    return this.setState((old: any) => remove(old, itemsToRemove));
  };
}

/**
 * Helper function to create a mergeSync function that removes the given item from an array property synchronously
 * @param {String|Number} propName  The name of the array property to remove from
 * @return {Function}  A function suitable for a store action
 */
export const removerSync = withFlushSync(remover);
