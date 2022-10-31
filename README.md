<img alt="React Thermals Logo" src="./assets/glider-logotype.png" height="64" />

# React Thermals

[![Build Status](https://ci.appveyor.com/api/projects/status/8lsgas1onep08hq3?svg=true&v=4.0.0-beta.10)](https://ci.appveyor.com/project/kensnyder/react-thermals)
[![Code Coverage](https://codecov.io/gh/kensnyder/react-thermals/branch/main/graph/badge.svg?token=KW4PAS3KKM&v=4.0.0-beta.10)](https://codecov.io/gh/kensnyder/react-thermals)
[![ISC License](https://img.shields.io/npm/l/react-thermals.svg?v=4.0.0-beta.10)](https://opensource.org/licenses/ISC)

Simple and extensible way to manage state in React

```bash
npm install react-thermals
```

## Table of contents

1. [Features](#features)
2. [Selectors](#selectors)
3. [Example Usage](#example-usage)
   1. [Global state example](#global-state-example)
   2. [Simple example](#simple-example)
   3. [Complex example](#complex-example)
4. [Writing Actions](#writing-actions)
5. [Action Creators](#action-creators)
6. [Code splitting](#code-splitting)
7. [Persistence](#persistence)
8. [All Store Options](#all-store-options)
9. [Suggested File Structure](#suggested-file-structure)
10. [Testing stores](#testing-stores)
11. [Events](#events)
12. [Plugins](#plugins)
13. [Middleware](#middleware)
14. [Credits](#credits)

## Features

1. Instead of dispatchers or observables, define simple action functions with no
   boilerplate
2. Components only re-render when relevant store state changes
3. Store actions are easily testable
4. Stores can respond to component lifecycle events including unmount
   (e.g. to abort fetching data)
5. A store can be used by one component or many components
6. Include stores by only the components that need them
7. Stores can optionally persist data even if all consumers unmount
8. Stores allow for worry-free code splitting

## Selectors

Selectors ensure that components will re-render only when a relevant part of
state changes.

Selectors are a core concept in React Thermals. They work the same as selectors
work in Redux and you can use libraries such as
[reselect](https://www.npmjs.com/package/reselect) or
[re-reselect](https://www.npmjs.com/package/re-reselect) with React Thermals to
manage selectors.

React Thermals can convert field names and field paths into selector functions.

### Selector examples

```js
// Select the value of a single field
const todos = useStoreSelector(myStore, state => state.todos);
const todos = useStoreSelector(myStore, 'todos');

// Select a deeper value
const userId = useStoreSelector(myStore, state => state.user.id);
const userId = useStoreSelector(myStore, 'user.id');

// Select a list of deeper values
const bookIds = useStoreSelector(myStore, state => state.books.map(b => b.id));
const bookIds = useStoreSelector(myStore, 'books[*].id');

// Select multiple fields using an array
const [sender, recipients] = useStoreSelector(myStore, [
  state => state.sender,
  state => state.recipients,
]);
const [sender, recipients] = useStoreSelector(myStore, [
  'sender',
  'recipients',
]);

// Select multiple deeper values using an array
const [senderEmail, recipientsEmails] = useStoreSelector(myStore, [
  state => state.sender.email,
  state => state.recipients.map(r => r.email),
]);
const [senderEmail, recipientsEmails] = useStoreSelector(myStore, [
  'sender.email',
  'recipients[*].email',
]);

// Use a mix of selector types
const [subject, sender, recipientsEmails] = useStoreSelector(myStore, [
  'subject',
  state => state.sender,
  'recipients[*].email',
]);
```

## Example usage

### Global state example

In stores/appStore/appStore.js

```js
import { createStore, useStoreSelector } from 'react-thermals';
const appStore = createStore();
export default appStore;
export function useAppState(selector) {
  return useStoreSelector(appStore, selector);
}
```

In stores/appStore/slices/todos.js

```js
import appStore, { useAppState } from '../appStore.js';
import persistState from 'react-thermals/plugins/persistState';

appStore.plugin(
  persistState({
    storage: localStorage,
    key: 'myTodos',
    fields: ['todos'],
  })
);

export default function useTodos() {
  return useAppState(state => state.todos);
}

appStore.mergeSync({ todos: [] });

export const todoActions = {
  add: appender('todos'),
  toggleComplete: arrayItemUpdater('todos', todo => ({
    ...todo,
    isComplete: !todo.isComplete,
  })),
  remove: fieldRemover('todos'),
};

appStore.addActions(todoActions);
```

In components/Header.jsx

```js
import React from 'react';
import { useAppState } from '../appStore.js';
export default function Header() {
  const incompleteCount = useAppState(
    state => state.todos.filter(todo => !todo.isComplete).length
  );
  return (
    <header>
      <h1>My App</h1>
      <div>Tasks remaining: {incompleteCount}</div>
    </header>
  );
}
```

In components/TodoList.jsx

```js
import React from 'react';
import useTodos, { todoActions } from '../stores/appStore/slices/todos.js';
import NewTodoForm from './NewTodoForm.jsx';
const { toggleComplete, remove } = todoActions;

export default function TodoList() {
  const todos = useTodos();
  return (
    <ul>
      {todos.map((todo, i) => (
        <li key={i}>
          <input
            type="checkbox"
            checked={todo.isComplete}
            onClick={() => toggleComplete(todo)}
          />
          <span className="text">{todo.text}</span>
          <span onClick={() => remove(todo)}>Delete</span>
        </li>
      ))}
      <li>
        <NewTodoForm />
      </li>
    </ul>
  );
}
```

In components/NewTodoForm.jsx

```js
import React, { useCallback } from 'react';
import { todoActions } from '../stores/appStore/slices/todos.js';
const { add } = todoActions;

export default function NewTodoForm() {
  const addTodo = useCallback(evt => {
    const form = evt.target;
    const data = new FormData(form);
    const todo = Object.fromEntries(data);
    todo.isComplete = false;
    form.reset();
    add(todo);
  }, []);
  return (
    <form onSubmit={addTodo}>
      <input name="text" placeholder="Enter todo..." />
      <button>Add</button>
    </form>
  );
}
```

---

---

In stores/appStore/slices/auth.js

```js
import appStore, { useAppState } from '../../appStore/appStore.js';
import { setterInput } from 'react-thermals/actions';

export default function useAuth() {
  return useAppState(state => state.user);
}

appStore.mergeSync({
  user: {
    isLoggedIn: false,
    isCheckingLogin: false,
  },
});

export const authActions = {
  async login(form) {
    const formData = Object.fromEntries(new FormData(form));
    appStore.mergeState({
      user: {
        isLoggedIn: false,
        isCheckingLogin: true,
      },
    });
    const { data } = axios.post('/api/users/login', formData);
    localStorage.setItem('jwt', data.jwt);
    appStore.mergeState({
      user: {
        ...data.user,
        isLoggedIn: true,
        isCheckingLogin: false,
      },
    });
  },
};

appStore.addActions(authActions);
```

In components/Login/Login.jsx

```js
import useAuth from '../../stores/slices/auth.js';
import Loader from '../Loader/Loader.jsx';
export default function Login() {
  const { isCheckingLogin } = useAuth();
  const { login } = authActions;
  return (
    <div className="LoginComponent">
      {isCheckingLogin ? (
        <Loader />
      ) : (
        <form onSubmit={evt => login(evt.target)}>
          <input name="email" type="input" />
          <input name="password" type="password" />
          <button>Submit</button>
        </form>
      )}
    </div>
  );
}
```

In components/Header.jsx

```js
import React from 'react';
import useAuth, { authActions } from '../../stores/slices/auth.js';
export default function Header() {
  const user = useAuth();
  return (
    <header>
      <h1>My App</h1>
      {user.isLoggedIn ? (
        <span>Hello {user.name}</span>
      ) : (
        <a href="/login">Login</a>
      )}
    </header>
  );
}
```

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

_Also note that you can shorten
`adderStore.useSelector(state => state.count);` to
`adderStore.useSelector('count');`._

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

For most actions, you can use helpers as documented [here](./actions/README.md).

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

## Action creators

For common types of state changes, React Thermals has 8 functions that will
create action functions. Supported state changes are:

1. [Set a single field value](./actions/README.md#fieldsetter)
2. [Toggle a field value](./actions/README.md#fieldtoggler)
3. [Append an item to a list](./actions/README.md#fieldappender)
4. [Remove an item from a list](./actions/README.md#fieldremover)
5. [Update an item in a list](./actions/README.md#fielditemupdater)
6. [Set a group of field values](./actions/README.md#fieldlistsetter)
7. [Add or subtract from a field value](./actions/README.md#fieldadder)
8. [Merge values into an object](./actions/README.md#fieldmerger)

[Full docs here](./actions/README.md).

## Code splitting

stuff.

## Persistence

By default, a store's state value will persist even when all components unmount.
To reset instead, add `autoReset: true` to the state definition.

```js
const myPersistingStore = new Store({
  // ...
  autoReset: true,
});
```

## All Store Options

The `createStore()` function takes an object with the following properties:

- {Object} state - The store's initial state. It can be of any type.
- {Object} actions - Named functions that can be dispatched by name and arguments.
- {Boolean} autoReset - If true, reset the store when all consumer components
  unmount (default false)
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

## Testing stores

Stores can be easily unit tested outside of a React Component.

### Examples

```js
import myStore from './myStore.js';

describe('myStore', () => {
  it('should add to cart with addToCart(item)', () => {
    myStore.setSync({ cart: [], total: 0 });
    myStore.actions.addToCart({
      id: 101,
      name: 'White Shoe',
      cost: 123,
    });
    myStore.flushSync();
    expect(myStore.getState()).toEqual({
      cart: [
        {
          id: 101,
          name: 'White Shoe',
          cost: 123,
        },
      ],
      total: 123,
    });
  });
});
```

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

The suite of events above allows powerful behavior using plugins. There are 5
included plugins:

1. [consoleLogger](#consolelogger) - Logs state changes to the console
2. [observable](#observable) - Adds a subscribe function to turn store into a
   observable subject
3. [persistState](#persistState) - Persists state to localStorage or
   sessionStorage
4. [syncUrl](#syncUrl) - Persists state to URL using history API
5. [undo](#undo) - Adds undo and redo capability to the store

Interested in writing your own plugins? Check out
[how to write plugins](#how-to-write-plugins).

## Middleware

React Thermals has a simple middleware system. Often it is simpler to just
subscribe to the `BeforeUpdate` event, but middleware is more intuitive to some
people.

### Examples

```js
// observe the state but do not alter
myStore.use((context, next) => {
  context.prev; // the old state value
  context.next; // the new state value
  context.isAsync; // true if middleware is expected to call next right away
  logToServer(context.next);
  next();
});

// alter the state
myStore.use((context, next) => {
  context.next = mockStore.next();
  next();
});

// call next asynchronously
myStore.use((context, next) => {
  debounceState(context.next, next);
});
```

## Credits

Inspired by
[@jhonnymichel's react-hookstore](https://github.com/jhonnymichel/react-hookstore/blob/6d23d2fcb0e7cf8a3929a01e0c543fe5e05ecf05/src/index.js)

Why start at version 4? React Thermals is an evolution of
[react-create-use-store version 3](https://npmjs.com/package/react-create-use-store).
