import Store from '../../classes/Store/Store';

/**
 * Helper function to create a mergeState function that appends and item to an array property
 * @param path  The name of or path to the array property to append to
 * @return  A function suitable for a store action
 */
export default function appender<ItemType>(path: string) {
  return function updater(this: Store, ...newItems: ItemType[]) {
    return this.mergeStateAt(path, newItems);
  };
}
