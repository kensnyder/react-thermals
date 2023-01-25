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
// Basic usage:
// store.plugin(persistState('preferences');
//
export default function persistState(
  path: string,
  {
    storage = localStorage,
    key = '',
    parse = JSON.parse,
    stringify = JSON.stringify,
  }: PersistStateConfig
) {
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
  // return the actual plugin initializer
  return function plugin(store: Store) {
    if (!key) {
      key = store.id;
    }
    store.on('BeforeFirstUse', (evt: PreventableEvent) => {
      const item = storage.getItem(key);
      const initial = item ? tryParse(parse, item) : evt.data;
      if (initial !== undefined) {
        store.setSyncAt(path, initial);
      }
      write(initial);
    });
    store.on('AfterUpdate', (evt: PreventableEvent) => write(evt.data.next));
  };
  // some helper functions
  function write(newValue: any) {
    storage.setItem(key, tryStringify(stringify, newValue));
  }
}
