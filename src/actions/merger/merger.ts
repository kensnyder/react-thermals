import withFlushSync from '../withFlushSync/withFlushSync';
import shallowOverride from '../../lib/shallowOverride/shallowOverride';
import { updatePath } from '../../lib/updatePath/updatePath';
import Store from '../../class/Store/Store';

/**
 * Build a setState function that merges the given object with the target object
 * @param path  The name of or path to the property to update
 * @return  A function suitable for a store action
 */
export function merger(path: string) {
  const merger = updatePath(path, shallowOverride);
  return function updater(this: Store, ...moreArgs: any[]) {
    this.setState((old: any) => merger(old, ...moreArgs));
  };
}

/**
 * Run merger and then flush pending state changes
 * @param path  The name of or path to the property to update
 * @return  A function suitable for a store action
 */
export const mergerSync = withFlushSync(merger);
