import withFlushSync from './withFlushSync.js';
import { deepUpdater } from '../src/deepUpdater/deepUpdater.js';

/**
 * Helper function to create a setState function that replaces a particular array item
 * @param {String} path  The name of or path to the value to merge
 * @return {Function}  A function suitable for a store action
 */
export function arrayItemUpdater(path) {
  const itemUpdate = deepUpdater(
    path,
    function itemUpdater(list, itemToUpdate, transformer) {
      return list?.map(item => {
        if (item === itemToUpdate) {
          return typeof transformer === 'function'
            ? transformer(item)
            : transformer;
        } else {
          return item;
        }
      });
    }
  );
  return function updater(itemToUpdate, transformer) {
    this.setState(old => itemUpdate(old, itemToUpdate, transformer));
  };
}

/**
 * Helper function to create a mergeSync function that adds the given amount to one property synchronously
 * e.g. use amount = 1 to create an incrementer function and amount = -1 for a decremeter function
 * @param {String|Number} propName  The name of the property to toggle
 * @return {Function}  A function suitable for a store action
 */
export const arrayItemUpdaterSync = withFlushSync(arrayItemUpdater);
