import withFlushSync from '../withFlushSync/withFlushSync';
import { updatePath } from '../../lib/updatePath/updatePath';
import Store from '../../classes/Store/Store';

/**
 * Build a setState function that removes the given item(s) from an array
 * @param path  The name of or path to the property to remove
 * @return  A function suitable for a store action
 */
export function remover<Item extends any>(path: string) {
  const remove = updatePath(
    path,
    function doRemove(old: Item, itemsToRemove: Item[]) {
      if (!old || !Array.isArray(old)) {
        return old;
      }
      return old.filter(value => !itemsToRemove.includes(value));
    }
  );
  return function updater(this: Store, ...itemsToRemove: Item[]) {
    return this.setState((fullState: any) => remove(fullState, itemsToRemove));
  };
}

/**
 * Run remover and then flush pending state changes
 * @param path  The name of or path to the property to remove
 * @return  A function suitable for a store action
 */
export const removerSync = withFlushSync(remover);
