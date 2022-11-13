import withFlushSync from '../withFlushSync/withFlushSync';
import { updatePath } from '../../lib/updatePath/updatePath';
import Store from '../../classes/Store/Store';

/**
 * Build a setState function that runs a map function against an array value
 * @param path  The name of or path to the property to update
 * @return  A function suitable for a store action
 */
export function mapper(path: string) {
  // we have to use { fn: mapFn } because updatePath getUpdateRunner would
  // fall into typeof transform === 'function' which interprets a passed
  // function as a setState mutator function
  const map = updatePath(
    path,
    function mapHandler(old: any, { fn: mapFn }: { fn: Function }) {
      return old?.map(mapFn);
    }
  );
  return function updater(this: Store, mapFn: Function) {
    return this.setState((old: any) => map(old, { fn: mapFn }));
  };
}

/**
 * Run mapper and then flush pending state changes
 * @param path  The name of or path to the property to update
 * @return  A function suitable for a store action
 */
export const mapperSync = withFlushSync(mapper);
