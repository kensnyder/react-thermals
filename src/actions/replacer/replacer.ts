import Store from '../../classes/Store/Store';
import isFunction from '../../lib/isFunction/isFunction';

/**
 * Build a setState function that replaces a particular array item
 * @param path  The name of or path to the value to replace
 * @return  A function suitable for a store action
 */
export default function replacer<Path extends string>(path: Path) {
  return function updater<Item extends any>(
    this: Store,
    itemToReplace: Item,
    newItem:
      | Item
      | PromiseLike<Item>
      | ((old: Item) => Item)
      | ((old: Item) => PromiseLike<Item>)
  ) {
    this.setStateAt(`${path}.*`, (item: Item) => {
      if (item === itemToReplace) {
        return isFunction(newItem) ? (newItem as Function)(item) : newItem;
      } else {
        return item;
      }
    });
  };
}
