import Store from '../../classes/Store/Store';

/**
 * Build a setState function that merges the given object with the target object
 * @param path  The name of or path to the property to update
 * @return  A function suitable for a store action
 */
export default function merger(path: string) {
  return function updater(this: Store, withValues: any) {
    this.mergeStateAt(path, withValues);
  };
}
