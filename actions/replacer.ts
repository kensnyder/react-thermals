import withFlushSync from './withFlushSync';
import { updatePath } from '../src/updatePath/updatePath';
import Store from '../src/Store/Store';

/**
 * Build a setState function that replaces a particular array item
 * @param {String} path  The name of or path to the value to merge
 * @return {Function}  A function suitable for a store action
 */
export function replacer(path: any) {
  const replaceItem = updatePath(path, function replaceHandler<
    T
  >(list: Array<T>, itemToReplace: T, newItem: T) {
    return list?.map(item => {
      if (item === itemToReplace) {
        return newItem;
      } else {
        return item;
      }
    });
  });
  return function updater(this: Store, itemToReplace: any, newItem: any) {
    this.setState((old: any) => replaceItem(old, itemToReplace, newItem));
  };
}

/**
 * Helper function to create a mergeSync function that adds the given amount to one property synchronously
 * e.g. use amount = 1 to create an incrementer function and amount = -1 for a decremeter function
 * @param {String|Number} propName  The name of the property to toggle
 * @return {Function}  A function suitable for a store action
 */
export const replacerSync = withFlushSync(replacer);
