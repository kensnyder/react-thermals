import withFlushSync from '../withFlushSync/withFlushSync';
import Store from '../../classes/Store/Store';

/**
 * Helper function to create a mergeState function that appends and item to an array property
 * @param path  The name of or path to the array property to append to
 * @return  A function suitable for a store action
 */
export function appender<ItemType>(path: string) {
  return function updater(this: Store, ...newItems: ItemType[]) {
    return this.setStateAt(path, (old: ItemType[]) => [...old, ...newItems]);
  };
}

/**
 * Helper function to create a mergeSync function that appends and item to an array property synchronously
 * @param propName  The name of the array property to append to
 * @return  A function suitable for a store action
 */
export const appenderSync = withFlushSync(appender);
