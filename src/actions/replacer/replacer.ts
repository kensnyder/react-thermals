import withFlushSync from '../withFlushSync/withFlushSync';
import Store from '../../classes/Store/Store';

function _replaceItem<T>(list: T[], itemToReplace: T, newItem: T) {
  return list?.map(item => {
    if (item === itemToReplace) {
      return newItem;
    } else {
      return item;
    }
  });
}

/**
 * Build a setState function that replaces a particular array item
 * @param path  The name of or path to the value to replace
 * @return  A function suitable for a store action
 */
export function replacer(path: any) {
  return function updater<Item>(
    this: Store,
    itemToReplace: Item,
    newItem: Item
  ) {
    this.setStateAt(path, (old: any) =>
      _replaceItem(old, itemToReplace, newItem)
    );
  };
}

/**
 * Run replacer and then flush pending state changes
 * @param path  The name of or path to the value to replace
 * @return  A function suitable for a store action
 */
export const replacerSync = withFlushSync(replacer);
