# React Thermals

[![Build Status](https://travis-ci.com/kensnyder/react-thermals.svg?branch=master&v=3.2.0)](https://travis-ci.com/kensnyder/react-thermals)
[![Code Coverage](https://codecov.io/gh/kensnyder/react-thermals/branch/master/graph/badge.svg?v=3.2.0)](https://codecov.io/gh/kensnyder/react-thermals)
[![ISC License](https://img.shields.io/npm/l/react-thermals.svg?v3.2.0)](https://opensource.org/licenses/ISC)

Simple and extensible way to manage shared state in React

<img alt="React Thermals Logo" src="./assets/glider.png" width="64" />

```bash
npm install react-thermals
```

## Table of contents

1. [Features](#features)
2. [Example Usage](#example-usage)
   1. [Simple example](#simple-example)
   2. [Complex example](#complex-example)
3. [Writing Actions](#writing-actions)
4. [All Store Options](#all-store-options)
5. [Suggested File Structure](#suggested-file-structure)
6. [Events](#events)
7. [Plugins](#plugins)
   1. [consoleLogger](#consolelogger)
   2. [observable](#observable)
   3. [persistState](#persistState)
   4. [syncUrl](#syncUrl)
   5. [undo](#undo)
8. [Credits](#credits)

## Features

1. Instead of reducers or observables, define simple action functions with no boilerplate
2. Store actions are easily testable
3. Stores can respond to component lifecycle events including unmount
   (e.g. to abort fetching data)
4. A store can be used by one component or many components
5. Stores are included by only the components that need them
6. Components only re-render when relevant store state changes
7. Stores can optionally persist data even if all consumers unmount
8. Stores allow for worry-free code splitting
9. Less than 4kb gzipped

## Example usage

### Simple example

In src/stores/adder/adderStore.js

```jsx harmony
import { createStore, useStoreState, useStoreSelector } from 'react-thermals';

// initial state
const state = { count: 0, extra: 'foo' };

// list of action functions
const actions = {
  add(addend) {
    store.setState(old => ({ ...old, count: old.count + addend }));
    // OR use mergeState to update a slice of state
    store.mergeState(old => ({ count: old.count + addend }));
  },
};

// create and export the store
const store = createStore({ state, actions });

// Due to the rules of hooks, we must define our hook functions manually
store.useState = () => useStoreState(store);
store.useSelector = (map = null, eq = null) => useStoreSelector(store, map, eq);

export default store;
```

In src/components/PlusTwo/PlusTwo.js

```jsx harmony
import React from 'react';
import adderStore from 'stores/adder/adderStore.js';

export function PlusTwo() {
  const state = adderStore.useState();
  const { add } = adderStore.actions;

  return (
    <>
      <button onClick={() => add(2)}>+2</button>
      <p>Count: {state.count}</p>
    </>
  );
}
```

Or use a `mapState` function to rerender only when a subset of state changes.

```jsx harmony
import React from 'react';
import adderStore from 'stores/adder/adderStore.js';

export function PlusTwo() {
  const count = adderStore.useSelector(state => state.count);
  const { add } = adderStore.actions;

  return (
    <>
      <button onClick={() => add(2)}>+2</button>
      <p>Count: {count}</p>
    </>
  );
}
```

In src/stores/adder/adderStore.spec.js

```jsx harmony
import React from 'react';
import adderStore from './adderStore.js';

describe('AdderStore', () => {
  it('should add numbers', () => {
    adderStore.state = { count: 5 };
    adderStore.actions.add(4);
    adderStore.flushSync();
    expect(adderStore.state.count).toBe(9);
  });
});
```

## Complex example

In src/stores/story/storyStore.js

```jsx harmony
import { createStore, useStoreState, useStoreSelector } from 'react-thermals';

// initial state
const state = {
  view: 'list',
  isLoading: false,
  stories: [],
};

// define action functions
function showView(view) {
  setState(old => ({ ...old, view }));
}

async function searchStories(term = '') {
  store.setState(old => ({ ...old, isLoading: true, stories: [] }));
  const stories = await api.get('/api/stories', { term });
  store.setState(old => ({ ...old, isLoading: false, stories }));
}

async function deleteStory(story) {
  const stories = store.state.stories.filter(s => s !== story);
  store.setState(old => ({ ...old, stories }));
  const deletedOk = await api.delete(`/api/stories/${story.id}`);
  if (!deletedOk) {
    alert('Server error deleting story');
  }
}

// list of action functions
const actions = {
  showView,
  searchStories,
  deleteStory,
};

// create and export the store
const store = createStore({
  state,
  actions,
  afterFirstMount: searchStories,
});

// Due to the rules of hooks, we must define our hook functions manually
store.useState = () => useStoreState(store);
store.useSelector = (map = null, eq = null) => useStoreSelector(store, map, eq);

export default store;
```

In src/components/StoryListing/StoryListing.js

```jsx harmony
import React, { useState } from 'react';
import storyStore from 'stores/StoryStore/StoryStore.js';
import StoryItem from '../StoryItem.js';

export function StoryListing() {
  const state = storyStore.useState();
  const { setView, searchStories } = storyStore.actions;
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="Component StoryListing">
      <h1>Stories</h1>
      <form onSubmit={runSearch}>
        <input value={searchTerm} onChange={updateSearchTerm} />
        <button>Search</button>
      </form>
      <button onClick={() => setView('list')}>list view</button>
      <button onClick={() => setView('grid')}>grid view</button>
      {state.stories.map(story => {
        <StoryItem key={story.id} story={story} />;
      })}
    </div>
  );

  function updateSearchTerm(event) {
    setSearchTerm(event.target.value);
  }

  function runSearch(event) {
    event.preventDefault();
    searchStories(searchTerm);
  }
}
```

In src/components/StoryItem/StoryItem.js

```jsx harmony
import React from 'react';
import storyStore from 'stores/story/storyStore.js';

export default function StoryItem({ story }) {
  // will only re-render if "story" or "view" changes
  const view = storyStore.useSelector(state => state.view);
  const { deleteStory } = storyStore.actions;

  const [w, h] = view === 'list' ? [110, 110] : [200, 180];

  return (
    <div className={`StoryItem Component view-${view}`}>
      <img url={story.image} width={w} height={h} />
      <h2 className="title">{story.title}</h2>
      <div className="descr">{story.descr}</div>
      <button onClick={() => deleteStory(story)}>[Delete]</button>
    </div>
  );
}
```

## Writing actions

`store.setState` works exactly like a setter function from a `useState()` pair.
`store.mergeState` works similarly, except the store will merge current state
with the partial state passed to mergeState.

Calling `state.setState` will trigger a rerender on all components that consume
the whole state and components that consume selected state that changes.

Note that by default, state persists even when all consumers have unmounted.
The effect is similar to having a global state that your top level `<App />`
consumes. To disable persistence, create the state with `autoReset` set to
`true`.

Many cross-component state patterns like Redux do not have built-in ways to code
split. In React Thermals, code splitting happens naturally because components must
`import` any stores they want to consume.

React Thermals are useful for global state, state that goes across components
or even state that is local to a single component.

## All Store Options

The `createStore()` function takes an object with the following properties:

- {Object} state - The store's initial state. It can be of any type.
- {Object} actions - Named functions that can be dispatched by name and arguments.
- {Boolean} autoReset - If true, reset the store when all consumer components
  unmount
- {String} id - An identifier that could be used by plugins or event listeners

All callbacks receive the store as a parameter.

## Suggested File Structure

For shared stores, e.g. a theme store:

- src/stores/theme/themeStore.js
- src/stores/theme/themeStore.spec.js

For reusable components or pages with private state, e.g. a header:

- src/components/Header/Header.js
- src/components/Header/Header.spec.js
- src/components/Header/store/headerStore.js
- src/components/Header/store/headerStore.spec.js

## Events

Stores fire a series of lifecycle events. For example:

```js
store.on('BeforeInitialState', () => {
  store.setSync({ my: 'new', initial: 'state' });
});
store.on('BeforeUpdate', evt => {
  if (evt.data.name.length < 4) {
    alert('name must be at least 4 characters');
    evt.preventDefault();
  }
});
```

### Event description & Cancelability

The following events fire during the life cycle of the store. Some events allow you use
`event.preventDefault()` to block the next step. For example, canceling the BeforeSet event
will block all pending state updates. Handlers can also call `event.stopImmediatePropagation()`
to block other handlers from firing this particular event.

| Event              | Description                                                 | Cancelable? |
| ------------------ | ----------------------------------------------------------- | ----------- |
| BeforeInitialState | Can alter initial state for first component that uses state | No          |
| AfterFirstUse      | Fires after store has been used by the first time           | No          |
| AfterFirstMount    | Fires after first component mounts                          | No          |
| AfterMount         | Fires after each component mounts                           | No          |
| AfterUnmount       | Fires after each component unmounts                         | No          |
| AfterLastUnmount   | Fires when last component unmounts                          | No          |
| SetterException    | Fires if a setter function throws an exception              | No          |
| BeforeSet          | Fires before any queued setter functions run                | Yes         |
| BeforeUpdate       | Fires before newly calculated state is propagated           | Yes         |
| AfterUpdate        | Fires after state is finalized but before React re-renders  | Yes         |
| BeforeReset        | Fires before state is reset (by reset() or by autoReset)    | Yes         |
| AfterReset         | Fires after state is reset (by reset() or by autoReset)     | Yes         |
| BeforePlugin       | Fires before a plugin is registered                         | Yes         |
| AfterPlugin        | Fires after a plugin is registered                          | No          |

### Event data

Each event comes with a `data` property. Below is the available data for each event that carries some.
Note the "Editable?" column which indicates events where altering event.data or its sub properties
will affect what happens next

| Event              | event.data property                                        | Editable?  |
| ------------------ | ---------------------------------------------------------- | ---------- |
| BeforeInitialState | The initial state (used by plugins to load persisted data) | data       |
| AfterFirstUse      | null                                                       | N/A        |
| AfterFirstMount    | null                                                       | N/A        |
| AfterMount         | null                                                       | N/A        |
| AfterUnmount       | null                                                       | N/A        |
| AfterLastUnmount   | null                                                       | N/A        |
| SetterException    | The Error object                                           | No         |
| BeforeSet          | Previous state                                             | No         |
| BeforeUpdate       | { prev, next } => previous state and next state            | data.next  |
| AfterUpdate        | { prev, next } => previous state and next state            | No         |
| BeforeReset        | { before, after } => state before and after the reset      | data.after |
| AfterReset         | { before, after } => state before and after the reset      | No         |
| BeforePlugin       | The plugin's initializer function (with name property)     | No         |
| AfterPlugin        | The plugin's initializer function (with name property)     | No         |

## Plugins

The suite of events above allows powerful behavior using plugins. There are 5 included plugins:

### consoleLogger

Log store lifecycle events to the console. Helpful for debugging timing or writing plugins.

```js
import consoleLogger from 'react-thermals/plugins/consoleLogger';
// log all store events to console
store.plugin(consoleLogger());
// log all AfterUpdate events to console
store.plugin(consoleLogger({ eventTypes: ['AfterUpdate'] }));
```

### observable

Turn the store into an observable to observe state changes.

```js
import observable from 'react-thermals/plugins/observable';
const store = createStore(/*...*/);
// turn store into an observable
store.plugin(observable());
store.subscribe(observer);
// observer.next(newState) called AfterUpdate
// observer.error() called on SetterException
// observer.complete() called AfterLastUnmount

// or you can simply provide next, error, and complete functions
store.subscribe(next, error, complete);
```

### persistState

Read and save all or some store data to localStorage or sessionStorage.

When first component mounts, load state or partial state from localStorage.
When state is updated, save state or partial state to localStorage.

```js
import persistState from 'react-thermals/plugins/persistState';
const store = createStore({
  state: { query: '', page: 1, sort: 'name' },
  // ...
});
// turn store into an observable
store.plugin(
  persistState({
    storage: localStorage,
    fields: ['sort'], // save only "sort" to localStorage
    key: 'user-search', // the localStorage key to store under
  })
);
```

### syncUrl

Read and save all or some store data to the URL.

When first component mounts, load state or partial state from the URL.
When state is updated, save state or partial state to the URL.

```js
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
    // override the default use of URLSearchParams for serializing
    // and deserializing
    parse: qs.parse,
    stringify: qs.stringify,
  })
);
```

Valid schema types:

- String and String[]
- Number and Number[]
- Date and Date[]
- Boolean and Boolean[]

### undo

Maintain an undo history and add .undo() and .redo() methods to the store.

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

## Credits

Inspired by [@jhonnymichel's react-hookstore](https://github.com/jhonnymichel/react-hookstore/blob/6d23d2fcb0e7cf8a3929a01e0c543fe5e05ecf05/src/index.js)

Why version 4? React Thermals is an evolution of [react-create-use-store version 3](https://npmjs.com/package/react-create-use-store).
