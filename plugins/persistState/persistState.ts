import { tryParse, tryStringify } from './parseAndStringify';

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
  key = null,
  parse = null,
  stringify = null,
}) {
  // validate options
  if (
    !storage ||
    typeof storage.getItem !== 'function' ||
    typeof storage.setItem !== 'function'
  ) {
    throw new Error(
      'react-thermals: persistState plugin must receive a storage object such as localStorage or sessionStorage'
    );
  }
  if (!Array.isArray(fields)) {
    throw new Error(
      'react-thermals: persistState plugin fields must be an array'
    );
  }
  if (typeof stringify !== 'function') {
    stringify = JSON.stringify;
  }
  if (typeof parse !== 'function') {
    parse = JSON.parse;
  }
  // return the actual plugin
  return function plugin(store) {
    if (!key) {
      key = store.id;
    }
    store.on('BeforeInitialState', evt => {
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
    store.on('AfterUpdate', evt => write(evt.data.next));
  };
  // some helper functions
  function write(newValue) {
    if (fields.length > 0) {
      newValue = deriveSubset(newValue);
    }
    storage.setItem(key, tryStringify(stringify, newValue));
  }
  function deriveSubset(obj) {
    const subset = {};
    for (const field of fields) {
      subset[field] = obj[field];
    }
    return subset;
  }
}
