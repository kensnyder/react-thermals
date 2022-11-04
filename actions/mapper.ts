import withFlushSync from './withFlushSync';
import { updatePath } from '../src/updatePath/updatePath';

/**
 * Build a setState function that runs a map function against an array value
 * @param {String} path  The name of or path to the property to update
 * @return {Function}  A function suitable for a store action
 */
export function mapper(path) {
  // we have to use { fn: mapFn } because updatePath getUpdateRunner would
  // fall into typeof transform === 'function' which interprets a passed
  // function as a setState mutator function
  const map = updatePath(path, function mapHandler(old, { fn: mapFn }) {
    return old?.map(mapFn);
  });
  return function updater(mapFn) {
    return this.setState(old => map(old, { fn: mapFn }));
  };
}

/**
 * Run mapper and then flush pending state changes
 * @param String} path  The name of or path to the property to update
 * @return {Function}  A function suitable for a store action
 */
export const mapperSync = withFlushSync(mapper);
