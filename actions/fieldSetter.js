import withFlushSync from './withFlushSync.js';

/**
 * Helper function to create a mergeState function that directly sets one property
 * @param {String|Number} propName  The name of the property to merge
 * @return {Function}  A function suitable for a store action
 */
export function fieldSetter(propName) {
  return function updater(newValue) {
    if (typeof newValue === 'function') {
      this.setState(old => ({ ...old, [propName]: newValue(old[propName]) }));
    } else {
      this.mergeState({ [propName]: newValue });
    }
  };
}

/**
 * Helper function to create a mergeSync function that directly sets one property synchronously
 * @param {String|Number} propName  The name of the property to merge
 * @return {Function}  A function suitable for a store action
 */
export const fieldSetterSync = withFlushSync(fieldSetter);

/**
 * Helper function to create a mergeSync function that directly sets one property synchronously
 * given a DOM event object (setting evt.target.value as the new value)
 * @param {String|Number} propName  The name of the property to merge
 * @return {Function}  A function suitable for an input's onChange handler
 */
export function fieldSetterInput(propName) {
  const updater = fieldSetterSync(propName);
  return function inputUpdater(evt) {
    updater.call(this, evt.target.value);
  };
}
