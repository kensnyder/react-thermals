import {
  tryParse,
  tryStringify,
  ParseType,
  StringifyType,
} from './parseAndStringify';
import Store from '../../classes/Store/Store';
import selectPath from '../../lib/selectPath/selectPath';

export type PersistStateConfig = {
  key?: string;
  path?: string;
  storage?: {
    getItem: (key: string) => any;
    setItem: (key: string, item: any) => void;
  };
  parse?: ParseType;
  stringify?: StringifyType;
};

/**
 *
 * @param key  The key under which to persist in localStorage/sessionStorage (defaults to store id)
 * @param [path=@]  The path to the part of state you want to persist
 * @param [storage=localStorage]  localStorage/sessionStorage or compatible
 * @param [parse=JSON.parse]  The unserialization function
 * @param [stringify=JSON.stringify]  The serialization function
 *
 * @example
 * Persist whole state in localStorage under "preferences"
 * store.plugin({ key: 'preferences' });
 *
 * @example
 * Persist state under "auth.user" path in localStorage under "user"
 * store.plugin({ key: 'user', path: 'auth.user' });
 *
 * @example
 * Persist state under "auth.user" path in sessionStorage under "user"
 * store.plugin({ key: 'user', path: 'auth.user', storage: sessionStorage });
 *
 */
export default function persistState({
  key = undefined,
  path = '@',
  storage = localStorage,
  parse = JSON.parse,
  stringify = JSON.stringify,
}: PersistStateConfig) {
  // validate options
  if (
    typeof storage?.getItem !== 'function' ||
    typeof storage?.setItem !== 'function'
  ) {
    throw new Error(
      'react-thermals: persistState plugin must receive a Storage object such as localStorage or sessionStorage'
    );
  }
  // return the actual plugin initializer
  return function plugin(store: Store) {
    if (!key) {
      key = store.id;
    }
    store.on('BeforeInitialize', evt => {
      const item = storage.getItem(key);
      let initial;
      if (item) {
        initial = tryParse(parse, item);
      }
      if (initial === undefined) {
        initial = selectPath(path)(evt.data);
      }
      if (initial !== undefined) {
        store.setStateAt(path, initial, {
          bypassAll: true,
        });
      }
      write(initial);
    });
    store.on('AfterUpdate', evt => write(selectPath(path)(evt.data.next)));
  };
  // some helper functions
  function write(newValue: any): void {
    storage.setItem(key, tryStringify(stringify, newValue));
  }
}
