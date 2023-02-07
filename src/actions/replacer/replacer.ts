import Store from '../../classes/Store/Store';

/**
 * Build a setState function that replaces a particular array item
 * @param path  The name of or path to the value to replace
 * @return  A function suitable for a store action
 */
export function replacer<Path extends string>(path: Path) {
  return function updater<Item extends any>(
    this: Store,
    itemToReplace: Item,
    newItem:
      | Item
      | Promise<Item>
      | ((old: Item) => Item)
      | ((old: Item) => Promise<Item>)
  ) {
    let hasAnyPromises = false;
    this.setStateAt(path, (list: Item[]) => {
      const newList: Item[] = [];
      for (const item of list) {
        if (item === itemToReplace) {
          if (typeof newItem === 'function') {
            newItem = (newItem as Function)(item);
          }
          newList.push(newItem as Item);
          if (newItem instanceof Promise) {
            hasAnyPromises = true;
          }
        } else {
          newList.push(item);
        }
      }
      if (hasAnyPromises) {
        return Promise.all(newList);
      } else {
        return newList;
      }
    });
  };
}

/**
 * Run replacer and then flush pending state changes
 * @param path  The name of or path to the value to replace
 * @return  A function suitable for a store action
 */
export function replacerSync<Path extends string>(path: Path) {
  return function updater<Item extends any>(
    this: Store,
    itemToReplace: Item,
    newItem: Item | ((old: Item) => Item)
  ) {
    this.setSyncAt(path, (list: Item[]) => {
      const newList: Item[] = [];
      for (const item of list) {
        if (item === itemToReplace) {
          if (typeof newItem === 'function') {
            newItem = (newItem as Function)(item);
          }
          newList.push(newItem as Item);
        } else {
          newList.push(item);
        }
      }
      return newList;
    });
  };
}
