import { castFromStrings, castToStrings } from './libs/cast.js';
import {
  parse as defaultParse,
  stringify as defaultStringify,
} from './libs/searchParams.js';
import isEmpty from './libs/isEmpty.js';
import { omitUnknown, omitKnown } from './libs/omit.js';
import { pushState, replaceState } from './libs/windowHistory.js';

//
// TO USE:
// store.plugin(syncUrl({ fields: ['term', 'sort'] }));
//
export default function syncUrl({
  fields = null,
  replace = false,
  schema = null,
  parse = null,
  stringify = null,
}) {
  if (fields && schema) {
    throw new Error(
      'react-thermals: syncUrl must receive "fields" or "schema" but not both'
    );
  }
  if (!fields && schema) {
    fields = Object.keys(schema);
  }
  if (!parse) {
    parse = defaultParse;
  }
  if (!stringify) {
    stringify = defaultStringify;
  }

  return function plugin(store) {
    store.on('BeforeInitialState', evt => {
      const urlData = parse(window.location.search);
      const known = omitUnknown(fields, urlData);
      if (known && !isEmpty(known)) {
        evt.data = { ...evt.data, ...castFromStrings(schema, known) };
      }
      writeUrl(castToStrings(schema, { ...urlData, ...evt.data }));
    });
    store.on('AfterUpdate', ({ data: { next } }) => {
      navigate(next);
    });
    store.on('AfterLastUnmount', clearUrl);
  };

  function writeUrl(fullState) {
    const search = '?' + stringify(fullState);
    // always replace on initial state
    replaceState(search);
  }

  function navigate(fullState) {
    const search = getNewSearch(fullState);
    if (replace) {
      replaceState(search);
    } else {
      pushState(search);
    }
  }

  function clearUrl() {
    const current = parse(window.location.search);
    const next = omitKnown(fields, current);
    const search = '?' + stringify(next);
    if (replace) {
      replaceState(search);
    } else {
      pushState(search);
    }
  }

  function getNewSearch(fullState) {
    const current = parse(window.location.search);
    const next = { ...current, ...fullState };
    return '?' + stringify(next);
  }
}

module.exports = syncUrl;
