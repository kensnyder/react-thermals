import isFunction from '../../lib/isFunction/isFunction';

/**
 * Build a setState function that replaces a particular array item
 * @return  A function suitable for store.connect(path, <function>)
 * @example
 * const store = new Store({ cart: ['apple', 'banana', 'orange'] });
 * const replaceItem = store.connect('cart', replacer());
 * replaceItem('banana', 'pear');
 * // => cart is now set to ['apple', 'pear', 'orange']
 */
export default function replacer() {
  return function updater<Item extends any>(
    itemToReplace: Item,
    newItem: Item | ((oldItem: Item) => Item)
  ) {
    return (old: Item[]) => {
      return old.map(item => {
        if (item === itemToReplace) {
          if (isFunction(newItem)) {
            return newItem(item);
          } else {
            return newItem;
          }
        }
        return item;
      });
    };
  };
}
