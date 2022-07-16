import withFlushSync from './withFlushSync.js';

/**
 * Helper function to create a mergeState function that directly toggles one property
 * @param {String|Number} propName  The name of the property to toggle
 * @return {Function}  A function suitable for a store action
 */
export function fieldToggler(propName) {
  return function updater() {
    return this.mergeState(old => ({
      [propName]: !old[propName],
    }));
  };
}

/**
 * Helper function to create a mergeSync function that directly toggles one property synchronously
 * @param {String|Number} propName  The name of the property to toggle
 * @return {Function}  A function suitable for a store action
 */
export const fieldTogglerSync = withFlushSync(fieldToggler);
