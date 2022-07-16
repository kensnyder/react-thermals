import withFlushSync from './withFlushSync.js';

/**
 * Helper function to create a mergeState function that runs a mapping against an array property
 * @param {String|Number} propName  The name of the array property to map
 * @return {Function}  A function suitable for a store action
 */
export function fieldMapper(propName) {
  return function updater(mapper) {
    return this.mergeState(old => ({
      [propName]: old[propName].map(mapper),
    }));
  };
}

/**
 * Helper function to create a mergeSync function that runs a mapping against an array property synchronously
 * @param {String|Number} propName  The name of the array property to map
 * @return {Function}  A function suitable for a store action
 */
export const fieldMapperSync = withFlushSync(fieldMapper);
