import withFlushSync from './withFlushSync.js';
import { updatePath } from '../src/updatePath/updatePath.js';

/**
 * Helper function to create a setState function that directly sets one value
 * @param {String} path  The name of or path to the value to merge
 * @return {Function}  A function suitable for a store action
 *
 * @example
 * const store = new Store({
 *     actions: {
 *         setPage: setter('page'),
 *     },
 *     state: { page: 1 },
 * });
 * store.actions.setPage(5);
 * // new state: { page: 5 }
 * store.actions.setPage(page => page + 1);
 * // new state: { page: 6 }
 *
 * const store = new Store({
 *     actions: {
 *         setPage: setter('results.page'),
 *     },
 *     state: { results: { page: 1 } },
 * });
 * store.actions.setPage(5);
 * // new state: { results: { page: 5 } }
 *
 * const store = new Store({
 *     actions: {
 *         deactivateUsers: setter('users[*].isActive'),
 *     },
 *     state: { users: [
 *         { id: 1, isActive: true },
 *         { id: 2, isActive: false },
 *     ] },
 * });
 * store.actions.deactivateUsers();
 * // new state: { users: [
 *     { id: 1, isActive: true },
 *     { id: 2, isActive: false },
 * ] }
 *
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
 *
 * @example
 *
 * import { actions, useMyStore } from 'src/myStore.js'
 * export default function NameInputComponent() {
 *     const name = useMyStore(state => state.name);
 *     return (
 *         <input value={name} onChange={actions.setName} />
 *     );
 * }
 */
export function setterInput(path) {
  const updater = setterSync(path);
  return function inputUpdater(evt) {
    updater.call(this, evt.target.value);
  };
}
