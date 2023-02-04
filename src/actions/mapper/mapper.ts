import withFlushSync from '../withFlushSync/withFlushSync';
import Store from '../../classes/Store/Store';

/**
 * Build a setState function that runs a map function against an array value
 * @param path  The name of or path to the property to update
 * @return  A function suitable for a store action
 */
export function mapper(path: string) {
  return function updater(this: Store, mapFn: (item: any) => any) {
    return this.setStateAt(path, (old: any[]) => old?.map(mapFn));
  };
}

/**
 * Run mapper and then flush pending state changes
 * @param path  The name of or path to the property to update
 * @return  A function suitable for a store action
 */
export const mapperSync = withFlushSync(mapper);
