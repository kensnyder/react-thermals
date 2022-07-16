/**
 * Helper function to create a mergeState function that directly sets one or more properties
 * @param {String[]|Number[]} propNames  The name of the properties to merge
 * @return {Function}  A function suitable for a store action
 */
export function fieldListSetter(propNames) {
  return function updater(...newValues) {
    this.mergeState(() => {
      const toMerge = {};
      for (let i = 0, len = propNames.length; i < len; i++) {
        toMerge[propNames[i]] = newValues[i];
      }
      return toMerge;
    });
  };
}

/**
 * Helper function to create a mergeState function that directly sets one or more properties synchronously
 * @param {String[]|Number[]} propNames  The name of the properties to merge
 * @return {Function}  A function suitable for a store action
 */
export function fieldListSetterSync(propNames) {
  return function updater(...newValues) {
    this.mergeSync(() => {
      const toMerge = {};
      for (let i = 0, len = propNames.length; i < len; i++) {
        toMerge[propNames[i]] = newValues[i];
      }
      return toMerge;
    });
  };
}
