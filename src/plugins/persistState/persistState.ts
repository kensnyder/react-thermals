import { tryParse, tryStringify } from './parseAndStringify';
import Store from '../../classes/Store/Store';
import PreventableEvent from '../../classes/PreventableEvent/PreventableEvent';

export type PersistStateConfig = {
  storage: Storage;
  fields?: string[];
  key?: string;
  parse?: Function;
  stringify?: Function;
};

//
// TO USE:
// store.plugin(persistState({
//   storage: localStorage,
//   key: 'myState',
//   fields: ['prefs'],
// }));
//
// where storage is localStorage, sessionStorage,
// or another object that implements getItem and setItem
//
export default function persistState({
  storage,
  fields = [],
  key = '',
  parse = JSON.parse,
  stringify = JSON.stringify,
}: PersistStateConfig) {
  // validate options
  if (
    !storage ||
    typeof storage.getItem !== 'function' ||
    typeof storage.setItem !== 'function'
  ) {
    throw new Error(
      'react-thermals: persistState plugin must receive a Storage object such as localStorage or sessionStorage'
    );
  }
  if (!Array.isArray(fields)) {
    throw new Error(
      'react-thermals: persistState plugin fields must be an array'
    );
  }
  // return the actual plugin
  return function plugin(store: Store) {
    if (!key) {
      key = store.id;
    }
    store.on('BeforeInitialState', (evt: PreventableEvent) => {
      const item = storage.getItem(key);
      const initial = item ? tryParse(parse, item) : evt.data;
      if (initial !== undefined) {
        if (fields.length === 0) {
          evt.data = initial;
        } else {
          evt.data = { ...evt.data, ...initial };
        }
      }
      write(evt.data);
    });
    store.on('AfterUpdate', (evt: PreventableEvent) => write(evt.data.next));
  };
  // some helper functions
  function write(newValue: any) {
    if (fields.length > 0) {
      newValue = deriveSubset(newValue);
    }
    storage.setItem(key, tryStringify(stringify, newValue));
  }
  function deriveSubset(obj: Record<string, any>) {
    const subset: Record<string, any> = {};
    for (const field of fields) {
      subset[field] = obj[field];
    }
    return subset;
  }
}
