import withFlushSync from './withFlushSync.js';
import { deepUpdater } from './deepUpdater.js';

/**
 * Helper function to create a setState function that directly sets one value
 * @param {String} path  The name of or path to the value to merge
 * @return {Function}  A function suitable for a store action
 */
export function fieldSetter(path) {
  const setField = deepUpdater(path, (oldValue, newValue) => {
    return newValue;
  });
  return function updater(newValue) {
    this.setState(old => {
      return setField(old, newValue);
    });
  };
}

/**
 * Run fieldSetter and then flush pending state changes
 * @param {String} path  The name of or path to the value to set
 * @return {Function}  A function suitable for a store action
 */
export const fieldSetterSync = withFlushSync(fieldSetter);

/**
 * Run fieldSetter and then flush pending state changes
 * using a DOM event object to set value to evt.target.value
 * @param {String} path  The name of or path to the value to set
 * @return {Function}  A function suitable for an input's onChange handler
 */
export function fieldSetterInput(path) {
  const updater = fieldSetterSync(path);
  return function inputUpdater(evt) {
    updater.call(this, evt.target.value);
  };
}
