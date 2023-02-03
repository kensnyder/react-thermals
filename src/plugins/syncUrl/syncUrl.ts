import { CastableSchema, castFromStrings, castToStrings } from './libs/cast';
import {
  parse as defaultParse,
  stringify as defaultStringify,
} from './libs/searchParams';
import isEmpty from './libs/isEmpty';
import { omitUnknown, omitKnown } from './libs/omit';
import { pushState, replaceSync } from './libs/windowHistory';
import Store from '../../classes/Store/Store';

export type SyncUrlConfig = {
  fields?: String[];
  schema?: CastableSchema;
  replace?: boolean;
  parse?: Function;
  stringify?: Function;
};

//
// Basic usage:
// store.plugin(syncUrl({ fields: ['term', 'ids'] }));
// OR
// store.plugin(syncUrl({ schema: { term: 'string', ids: 'number[]' }}));
//
export default function syncUrl({
  fields: givenFields = undefined,
  schema: givenSchema = undefined,
  replace = false,
  parse = defaultParse,
  stringify = defaultStringify,
}: SyncUrlConfig = {}) {
  if ((givenFields && givenSchema) || (!givenFields && !givenSchema)) {
    throw new Error(
      'react-thermals: syncUrl must receive "fields" or "schema" but not both'
    );
  }
  const schema = givenSchema || {};
  const fields = givenFields || Object.keys(schema);

  return function plugin(store: Store) {
    store.on('BeforeInitialize', evt => {
      const urlData = parse(location.search.slice(1));
      const known = omitUnknown(fields as string[], urlData);
      if (known && !isEmpty(known)) {
        store.extendSync(castFromStrings(schema, known));
      }
      writeUrl(castToStrings(schema, { ...urlData, ...evt.data }));
    });
    store.on('AfterUpdate', evt => {
      navigate(evt.data.next);
    });
    store.on('AfterLastUnmount', clearUrl);
  };

  function writeUrl(fullState: any) {
    const search = '?' + stringify(fullState);
    // always replace on initial state
    replaceSync(search);
  }

  function navigate(fullState: any) {
    const search = getNewSearch(fullState);
    if (replace) {
      replaceSync(search);
    } else {
      pushState(search);
    }
  }

  function clearUrl() {
    const current = parse(location.search);
    const next = omitKnown(fields as string[], current);
    const search = '?' + stringify(next);
    if (replace) {
      replaceSync(search);
    } else {
      pushState(search);
    }
  }

  function getNewSearch(fullState: any) {
    const current = parse(location.search);
    const next = { ...current, ...fullState };
    return '?' + stringify(next);
  }
}
