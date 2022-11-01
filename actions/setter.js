import withFlushSync from './withFlushSync.js';
import { updatePath } from '../src/updatePath/updatePath.js';

/**
 * Helper function to create a setState function that directly sets one value
 * @param {String} path  The name of or path to the value to merge
 * @return {Function}  A function suitable for a store action
 */
export function setter(path) {
  const setField = updatePath(path, function setHandler(oldValue, newValue) {
    return newValue;
  });
  return function updater(newValue) {
    this.setState(old => {
      return setField(old, newValue);
    });
  };
}

/**
 * Run setter and then flush pending state changes
 * @param {String} path  The name of or path to the value to set
 * @return {Function}  A function suitable for a store action
 */
export const setterSync = withFlushSync(setter);

/**
 * Run setter and then flush pending state changes
 * using a DOM event object to set value to evt.target.value
 * @param {String} path  The name of or path to the value to set
 * @return {Function}  A function suitable for an input's onChange handler
 */
export function setterInput(path) {
  const updater = setterSync(path);
  return function inputUpdater(evt) {
    updater.call(this, evt.target.value);
  };
}
