import withFlushSync from './withFlushSync.js';
import shallowOverride from '../src/shallowOverride/shallowOverride.js';

export function sliceUpdater(propName, updaterFunction = undefined) {
  if (typeof updaterFunction !== 'function') {
    updaterFunction = shallowOverride;
  }
  return function updater(...moreArgs) {
    this.mergeState(old => {
      const newSlice = updaterFunction(old[propName], ...moreArgs);
      if (typeof newSlice?.then === 'function') {
        return newSlice.then(newValue => ({
          [propName]: newValue,
        }));
      }
      return {
        [propName]: updaterFunction(old[propName], ...moreArgs),
      };
    });
  };
}
