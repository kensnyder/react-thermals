import withFlushSync from '../withFlushSync/withFlushSync';
import shallowOverride from '../../lib/shallowOverride/shallowOverride';
import Store from '../../classes/Store/Store';

/**
 * Build a setState function that merges the given object with the target object
 * @param path  The name of or path to the property to update
 * @return  A function suitable for a store action
 */
export function merger(path: string) {
  return function updater(this: Store, withValues: any) {
    this.setStateAt(path, (old: any) => shallowOverride(old, withValues));
  };
}

/**
 * Run merger and then flush pending state changes
 * @param path  The name of or path to the property to update
 * @return  A function suitable for a store action
 */
export const mergerSync = withFlushSync(merger);
