/**
 * Build a setState function that runs a map function against an array value
 * @return  A function suitable for store.connect(path, fn);
 */
export default function mapper<Item extends any>(mapFn: (item: Item) => any) {
  return function updater() {
    return (items: Item[]) => {
      return items.map(mapFn);
    };
  };
}
