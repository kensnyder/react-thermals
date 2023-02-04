import withFlushSync from '../withFlushSync/withFlushSync';
import Store from '../../classes/Store/Store';

function _replaceItem<T extends any>(
  list: T[],
  itemToReplace: T,
  newItem: T | ((old: T) => T)
) {
  const newList = [];
  for (const item of list) {
    if (item === itemToReplace) {
      if (typeof newItem === 'function') {
        newItem = (newItem as Function)(item);
      }
      newList.push(newItem);
    } else {
      newList.push(item);
    }
  }
  if (newItem instanceof Promise) {
    return newItem.then(finalValue => {
      return newList.map(item => (item === newItem ? finalValue : item));
    });
  }
  return newList;
}

/**
 * Build a setState function that replaces a particular array item
 * @param path  The name of or path to the value to replace
 * @return  A function suitable for a store action
 */
export function replacer<Item extends any>(path: any) {
  return function updater<Item>(
    this: Store,
    itemToReplace: Item,
    newItem: Item | Promise<Item> | ((old: Item) => Item)
  ) {
    this.setStateAt(path, (old: Item[]) => {
      if (newItem instanceof Promise) {
        return newItem.then(finalItem => {
          return _replaceItem(old, itemToReplace, finalItem);
        });
      }
      return _replaceItem(old, itemToReplace, newItem);
    });
  };
}

/**
 * Run replacer and then flush pending state changes
 * @param path  The name of or path to the value to replace
 * @return  A function suitable for a store action
 */
export const replacerSync = withFlushSync(replacer);
