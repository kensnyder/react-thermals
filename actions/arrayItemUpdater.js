import withFlushSync from './withFlushSync.js';
import shallowOverride from '../src/shallowOverride/shallowOverride.js';

export function arrayItemUpdater(propName, updaterFunction = undefined) {
  if (typeof updaterFunction !== 'function') {
    updaterFunction = shallowOverride;
  }
  return function updater(itemToUpdate, propsToOverride) {
    this.mergeState(old => {
      const newList = old[propName]?.map(item => {
        if (item === itemToUpdate) {
          return updaterFunction(item, propsToOverride);
        } else {
          return item;
        }
      });
      return {
        [propName]: newList,
      };
    });
  };
}

/**
 * Helper function to create a mergeSync function that adds the given amount to one property synchronously
 * e.g. use amount = 1 to create an incrementer function and amount = -1 for a decremeter function
 * @param {String|Number} propName  The name of the property to toggle
 * @return {Function}  A function suitable for a store action
 */
export const arrayItemUpdaterSync = withFlushSync(arrayItemUpdater);
