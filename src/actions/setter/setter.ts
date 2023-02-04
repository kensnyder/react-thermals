import withFlushSync from '../withFlushSync/withFlushSync';
import Store from '../../classes/Store/Store';

/**
 * Helper function to create a setState function that directly sets one value
 * @param path  The name of or path to the value to merge
 * @return  A function suitable for a store action
 */
export function setter(path: string) {
  return function updater(this: Store, newValue: any) {
    this.setStateAt(path, newValue);
  };
}

/**
 * Run setter and then flush pending state changes
 * @param path  The name of or path to the value to set
 * @return  A function suitable for a store action
 */
export const setterSync = withFlushSync(setter);

type InputEvent = {
  target: HTMLInputElement;
};

/**
 * Run setter and then flush pending state changes
 * using a DOM event object to set value to evt.target.value
 * @param path  The name of or path to the value to set
 * @return  A function suitable for an input's onChange handler
 */
export function setterInput(path: string) {
  return function updater(this: Store, evt: InputEvent) {
    this.setSyncAt(path, evt.target.value);
  };
}
