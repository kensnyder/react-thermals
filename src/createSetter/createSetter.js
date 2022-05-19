/**
 * Helper function to create a mergeState function that directly sets one property
 * @param {String|Number} propName  The name of the property to merge
 * @return {Function}  A function suitable for passing to store.setState()
 */
export function fieldSetter(propName) {
  return function merger(newValue) {
    if (typeof newValue === 'function') {
      this.setState(old => ({ ...old, [propName]: newValue(old[propName]) }));
      return;
    }
    this.mergeState({ [propName]: newValue });
  };
}
/**
 * Helper function to create a mergeState function that directly sets one or more properties
 * @param {String[]|Number[]} propNames  The name of the property to merge
 * @return {Function}  A function suitable for passing to store.setState()
 */
export function fieldListSetter(propNames) {
  return function merger(...newValues) {
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
 * Helper function to create a mergeState function that directly toggles one property
 * @param {String|Number} propName  The name of the property to toggle
 * @return {Function}  A function suitable for passing to store.setState()
 */
export function fieldToggler(propName) {
  return function merger() {
    return this.mergeState(old => ({
      [propName]: !old[propName],
    }));
  };
}

/**
 * Helper function to create a mergeState function that adds the given amount to one property
 * e.g. use amount = 1 to create an incrementer function and amount = -1 for a decremeter function
 * @param {String|Number} propName  The name of the property to toggle
 * @return {Function}  A function suitable for passing to store.setState()
 */
export function fieldAdder(propName, amount) {
  return function merger() {
    return this.mergeState(old => ({
      [propName]: old[propName] + amount,
    }));
  };
}

/**
 * Helper function to create a mergeState function that appends and item to an array property
 * @param {String|Number} propName  The name of the array property to append to
 * @return {Function}  A function suitable for passing to store.setState()
 */
export function fieldAppender(propName) {
  return function merger(...newItems) {
    return this.mergeState(old => ({
      [propName]: [...old[propName], ...newItems],
    }));
  };
}

/**
 * Helper function to create a mergeState function that removes the given item from an array property
 * @param {String|Number} propName  The name of the array property to remove from
 * @return {Function}  A function suitable for passing to store.setState()
 */
export function fieldRemover(propName) {
  return function merger(...itemsToRemove) {
    return this.mergeState(old => ({
      [propName]: old[propName].filter(val => !itemsToRemove.includes(val)),
    }));
  };
}

/**
 * Helper function to create a mergeState function that runs a mapping against an array property
 * @param {String|Number} propName  The name of the array property to map
 * @return {Function}  A function suitable for passing to store.setState()
 */
export function fieldMapper(propName) {
  return function merger(mapper) {
    return this.mergeState(old => ({
      [propName]: old[propName].map(mapper),
    }));
  };
}
