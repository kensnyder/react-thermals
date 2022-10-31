import withFlushSync from './withFlushSync.js';
import { updatePath } from '../src/updatePath/updatePath.js';

/**
 * Helper function to create a setState function that replaces a particular array item
 * @param {String} path  The name of or path to the value to merge
 * @return {Function}  A function suitable for a store action
 */
export function replacer(path) {
  const replaceItem = updatePath(
    path,
    function replaceHandler(list, itemToReplace, newItem) {
      return list?.map(item => {
        if (item === itemToReplace) {
          return newItem;
        } else {
          return item;
        }
      });
    }
  );
  return function updater(itemToReplace, newItem) {
    this.setState(old => replaceItem(old, itemToReplace, newItem));
  };
}

/**
 * Helper function to create a mergeSync function that adds the given amount to one property synchronously
 * e.g. use amount = 1 to create an incrementer function and amount = -1 for a decremeter function
 * @param {String|Number} propName  The name of the property to toggle
 * @return {Function}  A function suitable for a store action
 */
export const arrayItemUpdaterSync = withFlushSync(replacer);
