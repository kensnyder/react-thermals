import withFlushSync from './withFlushSync.js';
import shallowOverride from '../src/shallowOverride/shallowOverride.js';
import { deepUpdater } from '../src/deepUpdater/deepUpdater.js';

// TODO: rename to fieldMerger
export function sliceUpdater(path) {
  const merger = deepUpdater(path, shallowOverride);
  return function updater(...moreArgs) {
    this.setState(old => merger(old, ...moreArgs));
  };
}

export const sliceUpdaterSync = withFlushSync(sliceUpdater);
