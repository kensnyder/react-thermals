import withFlushSync from '../withFlushSync/withFlushSync';
import { updatePath } from '../../lib/updatePath/updatePath';
import Store from '../../classes/Store/Store';

/**
 * Helper function to create a mergeState function that appends and item to an array property
 * @param path  The name of or path to the array property to append to
 * @return  A function suitable for a store action
 */
export function appender(path: string) {
  const append = updatePath(
    path,
    function appendHandler(old: any, newItems: any[]) {
      return [...old, ...newItems];
    }
  );
  return function updater(this: Store, ...newItems: any[]) {
    return this.setState((old: any) => append(old, newItems));
  };
}

/**
 * Helper function to create a mergeSync function that appends and item to an array property synchronously
 * @param propName  The name of the array property to append to
 * @return  A function suitable for a store action
 */
export const appenderSync = withFlushSync(appender);
