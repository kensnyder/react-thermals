import withFlushSync from './withFlushSync.js';
import shallowOverride from '../src/shallowOverride/shallowOverride.js';
import { deepUpdater } from './deepUpdater.js';

export function arrayItemUpdater(path, updaterFunction = undefined) {
  if (typeof updaterFunction !== 'function') {
    updaterFunction = shallowOverride;
  }
  const itemUpdate = deepUpdater(
    path,
    function itemUpdater(list, itemToUpdate, overrides) {
      return list?.map(item => {
        if (item === itemToUpdate) {
          return updaterFunction(item, overrides);
        } else {
          return item;
        }
      });
    }
  );
  return function updater(itemToUpdate, propsToOverride) {
    this.setState(old => itemUpdate(old, itemToUpdate, propsToOverride));
  };
}

/**
 * Helper function to create a mergeSync function that adds the given amount to one property synchronously
 * e.g. use amount = 1 to create an incrementer function and amount = -1 for a decremeter function
 * @param {String|Number} propName  The name of the property to toggle
 * @return {Function}  A function suitable for a store action
 */
export const arrayItemUpdaterSync = withFlushSync(arrayItemUpdater);
