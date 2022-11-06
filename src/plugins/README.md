# Plugins shipped with react-thermals

Plugins can be imported from `react-thermals/plugins/{pluginName}`

## Table of contents

1. [consoleLogger](#consolelogger)
2. [observable](#observable)
3. [persistState](#persistState)
4. [syncUrl](#syncUrl)
5. [undo](#undo)
6. [How to write plugins](#how-to-write-plugins)

## consoleLogger

Log store lifecycle events to the console. Helpful for debugging timing or writing plugins.

```js
import consoleLogger from 'react-thermals/plugins/consoleLogger';
// log all store events to console
store.plugin(consoleLogger());
// log all AfterUpdate events to console
store.plugin(consoleLogger({ eventTypes: ['AfterUpdate'] }));
```

## observable

Turn the store into an observable to observe state changes.

```js
import makeObservable from 'react-thermals/plugins/observable';
const store = createStore(/*...*/);
// turn store into an observable
store.plugin(makeObservable());
store.subscribe(observer);
// observer.next(newState) called AfterUpdate
// observer.error() called on SetterException
// observer.complete() called AfterLastUnmount

// or you can simply provide next, error, and complete functions
store.subscribe(next, error, complete);
```

## persistState

Read and save all or some store data to localStorage or sessionStorage.

When first component mounts, load state or partial state from localStorage.
When state is updated, save state or partial state to localStorage.

```js
import persistState from 'react-thermals/plugins/persistState';
const store = createStore({
  state: { query: '', sort: 'name' },
  // ...
});
// persist "sort" value to localStorage
store.plugin(
  persistState({
    storage: localStorage,
    fields: ['sort'], // save only "sort" to localStorage
    key: 'user-search', // the localStorage key to store under
  })
);
```

## syncUrl

Read and save all or some store data to the URL.

When first component mounts, load state or partial state from the URL.
When state is updated, save state or partial state to the URL.

```js
import qs from 'qs';
import syncUrl from 'react-thermals/plugins/syncUrl';

const store = createStore({
  state: { query: '', page: 1, sort: 'name' },
  // ...
});
store.plugin(
  syncUrl({
    // use history.replaceState to avoid back-button state
    replace: true,
    // save query and page to URL
    schema: {
      query: 'String',
      page: 'Number', // when pulling from URL, parse as Number
    },
    // OPTIONAL:
    // override the default use of URLSearchParams for serializing
    // and deserializing
    parse: qs.parse,
    stringify: qs.stringify,
  })
);
```

Valid schema types:

- `String and String[]`
- `Number` and `Number[]`
- `Date` and `Date[]`
- `Boolean` and `Boolean[]`

## undo

Maintain an undo history and
add .undo(), .redo(), .jump(), .jumpTo() methods to the store.

```js
import undo from 'react-thermals/plugins/undo';
const store = createStore({
  /* ... */
});
store.plugin(undo({ maxSize: 20 }));
//...
store.undo();
store.redo();
store.jumpTo(5);
```

## How to write plugins

Here is an example plugin that loads and saves user settings.

```js
export default function syncUserSettings({ baseUrl }) {
  return function plugin(store) {
    store.on('AfterFirstMount', evt => {
      fetch(`${baseUrl}/api/user/settings`)
        .then(r => r.json())
        .then(settings => {
          store.mergeState({ settings });
        });
    });
    store.on('AfterUpdate', evt => {
      fetch({
        method: 'POST',
        url: `${baseUrl}/api/user/settings`,
        data: evt.data.next.settings,
      });
    });
  };
}
```
