/**
 * Build a setState function that runs a map function against an array value
 * @return  A function suitable for store.connect(path, <function>)
 *
 * @example
 * const store = new Store({ prices: [10, 20, 30] });
 * const applyDiscount = store.connect('prices', price => price * 0.9);
 * applyDiscount();
 * // => "prices" now equals [9, 18, 27]
 */
export default function mapper<Item extends any>(mapFn: (item: Item) => any) {
  return function updater() {
    return (items: Item[]) => {
      return items.map(mapFn);
    };
  };
}
