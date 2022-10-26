import withFlushSync from './withFlushSync.js';
import shallowOverride from '../src/shallowOverride/shallowOverride.js';
import { deepUpdater } from '../src/deepUpdater/deepUpdater.js';

export function sliceUpdater(path, updaterFunction = undefined) {
  if (typeof updaterFunction !== 'function') {
    updaterFunction = shallowOverride;
  }
  const sliceUpdate = deepUpdater(path, updaterFunction);
  return function updater(...moreArgs) {
    this.setState(old => sliceUpdate(old, ...moreArgs));
  };
}

export const sliceUpdaterSync = withFlushSync(sliceUpdater);
