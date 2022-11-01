import withFlushSync from './withFlushSync.js';
import shallowOverride from '../src/shallowOverride/shallowOverride.js';
import { updatePath } from '../src/updatePath/updatePath.js';

/**
 * Build a setState function that merges the given object with the target object
 * @param {String} path  The name of or path to the property to update
 * @return {Function}  A function suitable for a store action
 */
export function merger(path) {
  const merger = updatePath(path, shallowOverride);
  return function updater(...moreArgs) {
    this.setState(old => merger(old, ...moreArgs));
  };
}

/**
 * Run merger and then flush pending state changes
 * @param {String} path  The name of or path to the property to update
 * @return {Function}  A function suitable for a store action
 */
export const mergerSync = withFlushSync(merger);
