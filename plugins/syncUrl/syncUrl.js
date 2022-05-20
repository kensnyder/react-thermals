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
      'react-thermals: syncUrl must receive "fields" or "stringify" but not both'
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
      // const [known, unknown] = partitionKnown(urlData);
      const known = omitUnknown(urlData);
      if (known && !isEmpty(known)) {
        evt.data = { ...evt.data, ...known };
      }
      writeUrl(castToStrings({ ...urlData, ...evt.data }));
    });
    store.on('AfterUpdate', ({ data: { next } }) => {
      navigate(next);
    });
    store.on('AfterLastUnmount', () => {
      clearUrl();
    });
  };
  function castToStrings(obj) {
    if (!schema) {
      return obj;
    }
    const casted = {};
    for (const [key, value] of Object.entries(obj)) {
      casted[key] = castFromString(key, value);
    }
    return casted;
  }
  function castFromStrings(obj) {
    if (!schema) {
      return obj;
    }
    const casted = {};
    for (const [key, value] of Object.entries(obj)) {
      casted[key] = castToString(key, value);
    }
    return casted;
  }
  function castToString(field, value) {
    const toType = schema[field];
    if (!toType) {
      return value;
    }
    switch (toType.toLowerCase()) {
      case 'string':
      case 'string[]':
      case 'number':
      case 'number[]':
        return String(value);
      case 'date':
        return new Intl.DateTimeFormat().format(value);
      case 'date[]':
        return value.map(v => new Intl.DateTimeFormat().format(v));
      case 'boolean':
        return value ? 'true' : 'false';
      case 'boolean[]':
        return value.map(v => (v ? 'true' : 'false'));
      default:
        throw new Error(`react-thermals: unknown schema type "${toType}"`);
    }
  }
  function castFromString(field, value) {
    const toType = schema[field];
    if (!toType) {
      return value;
    }
    switch (toType.toLowerCase()) {
      case 'string':
        return value;
      case 'string[]':
        return value.split(',');
      case 'number':
        return parseFloat(value);
      case 'number[]':
        return value.split(',').map(parseFloat);
      case 'date':
        return new Date(Date.parse(value));
      case 'date[]':
        return value.split(',').map(v => new Date(Date.parse(v)));
      case 'boolean':
        return value === 'true';
      case 'boolean[]':
        return value.split(',').map(v => v === 'true');
      default:
        throw new Error(`react-thermals: unknown schema type "${toType}"`);
    }
  }
  function isEmpty(obj) {
    for (const key in obj) {
      if (Object.hasOwnProperty.call(obj, key)) {
        return false;
      }
    }
    return true;
  }
  function defaultParse(search) {
    const obj = {};
    for (const [key, value] of new URLSearchParams(search)) {
      obj[key] = value;
    }
    return obj;
  }
  function defaultStringify(obj) {
    const params = new URLSearchParams(obj);
    params.sort();
    return params.toString();
  }

  function writeUrl(fullState) {
    const search = '?' + stringify(fullState);
    // always replace on initial state
    window.history.replaceState({}, document.title, search);
  }

  function navigate(fullState) {
    const search = _getNewSearch(fullState);
    if (replace) {
      window.history.replaceState({}, document.title, search);
    } else {
      window.history.pushState({}, document.title, search);
    }
  }

  function partitionKnown(obj) {
    const known = {};
    const unknown = {};
    for (const [key, value] of Object.entries(obj)) {
      if (fields.includes(key)) {
        known[key] = value;
      } else {
        unknown[key] = value;
      }
    }
    return [known, unknown];
  }

  function omitUnknown(obj) {
    const known = {};
    for (const [key, value] of Object.entries(obj)) {
      if (fields.includes(key)) {
        known[key] = value;
      }
    }
    return known;
  }

  function omitKnown(obj) {
    const unknown = {};
    for (const [key, value] of Object.entries(obj)) {
      if (!fields.includes(key)) {
        unknown[key] = value;
      }
    }
    return unknown;
  }

  function clearUrl() {
    const current = parse(window.location.search);
    const next = omitKnown(current);
    const search = '?' + stringify(next);
    if (replace) {
      window.history.replaceState({}, document.title, search);
    } else {
      window.history.pushState({}, document.title, search);
    }
  }

  function _getNewSearch(fullState) {
    const current = parse(window.location.search);
    const next = { ...current, ...fullState };
    return '?' + stringify(next);
  }
}

module.exports = syncUrl;
