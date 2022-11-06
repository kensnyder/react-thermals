import withFlushSync from './withFlushSync';
import { updatePath } from '../updatePath/updatePath';
import Store from '../Store/Store';

/**
 * Helper function to create a setState function that directly sets one value
 * @param {String} path  The name of or path to the value to merge
 * @return {Function}  A function suitable for a store action
 */
export function setter(path: string) {
  const setField = updatePath(
    path,
    function setHandler(oldValue: any, newValue: any) {
      return newValue;
    }
  );
  return function updater(this: Store, newValue: any) {
    this.setState((old: any) => {
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

type InputEvent = {
  target: HTMLInputElement;
};

/**
 * Run setter and then flush pending state changes
 * using a DOM event object to set value to evt.target.value
 * @param {String} path  The name of or path to the value to set
 * @return {Function}  A function suitable for an input's onChange handler
 */
export function setterInput(path: string) {
  const updater = setterSync(path);
  return function inputUpdater(this: Store, evt: InputEvent) {
    updater.call(this, evt.target.value);
  };
}