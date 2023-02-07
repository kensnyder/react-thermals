import Store from '../../classes/Store/Store';
import isArray from '../../lib/isArray/isArray';

/**
 * Build a setState function that removes the given item(s) from an array
 * @param path  The name of or path to the property to remove
 * @return  A function suitable for a store action
 */
export default function remover<Item extends any>(path: string) {
  return function updater(this: Store, ...itemsToRemove: Item[]) {
    return this.setStateAt(path, (old: Item[]) => {
      if (!old || !isArray(old)) {
        return old;
      }
      return old.filter(value => !itemsToRemove.includes(value));
    });
  };
}
