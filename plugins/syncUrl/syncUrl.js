//
// TO USE:
// store.plugin(syncUrl({ fields: ['term', 'sort'] }));
//
export default function syncUrl({
  fields = null,
  replace = false,
  schema = null,
}) {
  if (!fields && schema) {
    fields = Object.keys(schema);
  }
  return function plugin(store) {
    store.on('BeforeInitialState', evt => {
      const urlData = readUrl();
      if (urlData) {
        evt.data = urlData;
      }
      writeUrl(evt.data);
    });
    store.on('AfterUpdate', ({ data: { next } }) => {
      navigate(next);
    });
    store.on('AfterLastUnmount', () => {
      clearUrl();
    });
  };
  function readUrl() {
    const params = new URLSearchParams(window.location.search);
    const data = {};
    let hasData = false;
    for (const field of fields || params.keys()) {
      if (params.has(field)) {
        data[field] = params.get(field);
        hasData = true;
      }
    }
    return hasData ? data : null;
  }

  function writeUrl(fullState) {
    const search = _getNewSearch(fullState);
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

  function clearUrl() {
    const params = new URLSearchParams(window.location.search);
    for (const field of fields || params.keys()) {
      params.delete(field);
    }
    const search = '?' + params.toString();
    if (replace) {
      window.history.replaceState({}, document.title, search);
    } else {
      window.history.pushState({}, document.title, search);
    }
  }

  function _getNewSearch(fullState) {
    const params = new URLSearchParams(window.location.search);
    for (const field of fields || params.keys()) {
      params.set(field, fullState[field]);
    }
    params.sort();
    return '?' + params.toString();
  }
}

module.exports = syncUrl;
