import withFlushSync from './withFlushSync.js';
import { updatePath } from '../src/updatePath/updatePath.js';

/**
 * Helper function to create a setState function that directly toggles one value
 * @param {String} path  The name of or path to the value to toggle
 * @return {Function}  A function suitable for a store action
 */
export function toggler(path) {
  const toggle = updatePath(path, function toggleHandler(old) {
    return !old;
  });
  return function updater() {
    return this.setState(toggle);
  };
}

/**
 * Run toggler and then flush pending state changes
 * @param {String} path  The name of or path to the value to toggle
 * @return {Function}  A function suitable for a store action
 */
export const togglerSync = withFlushSync(toggler);
