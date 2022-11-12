import withFlushSync from '../withFlushSync/withFlushSync';
import { updatePath } from '../../class/updatePath/updatePath';
import Store from '../../class/Store/Store';

/**
 * Helper function to create a setState function that directly toggles one value
 * @param {String} path  The name of or path to the value to toggle
 * @return {Function}  A function suitable for a store action
 */
export function toggler(path: string) {
  const toggle = updatePath(path, function toggleHandler(old: boolean) {
    return !old;
  });
  return function updater(this: Store) {
    return this.setState(toggle);
  };
}

/**
 * Run toggler and then flush pending state changes
 * @param {String} path  The name of or path to the value to toggle
 * @return {Function}  A function suitable for a store action
 */
export const togglerSync = withFlushSync(toggler);
