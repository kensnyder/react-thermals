import withFlushSync from './withFlushSync';
import shallowOverride from '../src/shallowOverride/shallowOverride';
import { updatePath } from '../src/updatePath/updatePath';
import Store from '../src/Store/Store';

/**
 * Build a setState function that merges the given object with the target object
 * @param {String} path  The name of or path to the property to update
 * @return {Function}  A function suitable for a store action
 */
export function merger(path: string) {
  const merger = updatePath(path, shallowOverride);
  return function updater(this: Store, ...moreArgs: Array<any>) {
    this.setState((old: any) => merger(old, ...moreArgs));
  };
}

/**
 * Run merger and then flush pending state changes
 * @param {String} path  The name of or path to the property to update
 * @return {Function}  A function suitable for a store action
 */
export const mergerSync = withFlushSync(merger);
