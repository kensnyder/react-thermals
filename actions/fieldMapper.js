import withFlushSync from './withFlushSync.js';
import { deepUpdater } from './deepUpdater.js';

/**
 * Helper function to create a setState function that runs a map function against an array value
 * @param {String} path  The name of or path to the property to update
 * @return {Function}  A function suitable for a store action
 */
export function fieldMapper(path) {
  const map = deepUpdater(path, function mapper(old, mapFn) {
    return old?.map(mapFn);
  });
  return function updater(mapFn) {
    return this.setState(old => map(old, mapFn));
  };
}

/**
 * Run fieldMapper and then flush pending state changes
 * @param String} path  The name of or path to the property to update
 * @return {Function}  A function suitable for a store action
 */
export const fieldMapperSync = withFlushSync(fieldMapper);
