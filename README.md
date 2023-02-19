<img alt="React Thermals Logo" src="https://github.com/kensnyder/react-thermals/raw/main/assets/glider-logotype.png" height="64" />

[![NPM Link](https://img.shields.io/npm/v/react-thermals?v=4.0.0-beta.20)](https://npmjs.com/package/react-thermals)
[![Build Status](https://ci.appveyor.com/api/projects/status/8lsgas1onep08hq3?svg=true&v=4.0.0-beta.20)](https://ci.appveyor.com/project/kensnyder/react-thermals)
[![Code Coverage](https://codecov.io/gh/kensnyder/react-thermals/branch/main/graph/badge.svg?token=KW4PAS3KKM&v=4.0.0-beta.20)](https://codecov.io/gh/kensnyder/react-thermals)
[![ISC License](https://img.shields.io/npm/l/react-thermals.svg?v=4.0.0-beta.20)](https://opensource.org/licenses/ISC)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fkensnyder%2Freact-thermals.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fkensnyder%2Freact-thermals?ref=badge_shield)

React thermals is a simple and extensible way to manage state in React

```bash
npm install react-thermals
```

## Table of contents

1. [Features](#features)
   1. [Changelog](https://github.com/kensnyder/react-thermals/blob/master/CHANGELOG.md)
   1. [Roadmap](https://github.com/kensnyder/react-thermals/blob/master/ROADMAP.md)
2. [Core Concepts](#features)
   1. [Properties and Paths](#properties-and-paths)
   2. [Selectors](#selectors)
   3. [Immutability](#immutability)
   4. [Persistence](#persistence)
3. [Example Usage](#example-usage)
   1. [Example 1: A store with global state](#example-1-a-store-with-global-state)
   2. [Example 2: A store used by multiple components](#example-2-a-store-used-by-multiple-components)
   3. [Example 3: A store used by one component](#example-3-a-store-used-by-one-component)
4. [Action Functions](#action-functions)
   1. [Writing Actions](#writing-actions)
   2. [Action Creators](#action-creators)
   3. [Action Batching](#action-batching)
   4. [Asynchronous Actions](#asynchronous-actions)
5. [Full Documentation](#all-store-options)
   1. [All Store Options](#all-store-options)
   2. [Common Store Methods](#common-store-methods)
   3. [Other Store Methods](#other-store-methods)
6. [Best Practices](#best-practices)
   1. [Code Splitting](#code-splitting)
   2. [Suggested File Structure](#suggested-file-structure)
   3. [Testing Stores](#testing-stores)
7. [Extending Store Behavior](#extending-store-behavior)
   1. [Events](#events)
   2. [Plugins](#plugins)
   3. [Middleware](#middleware)
8. [Community](#community)
   1. [Contributing](#contributing)
   2. [ISC License](#isc-license)
   3. [Credits](#credits)


[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fkensnyder%2Freact-thermals.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fkensnyder%2Freact-thermals?ref=badge_large)

## Features

1. Instead of dispatchers or observables, define simple action functions with no
   boilerplate
2. Components only re-render when relevant state changes
3. Promises are first-class citizens (state changes can be wrapped in Promises)
4. A store can be used by one component or many components
5. Path expressions make it super easy to deal with immutable data structures
6. Include stores only in the components that need them
7. Stores persist data even if all consumers unmount (optional)
8. Stores allow worry-free code splitting
9. Store actions are easily testable
10. Stores can respond to component lifecycle events including unmount
    (e.g. to abort fetching data)
11. No higher-order functions are needed in `<App />` or elsewhere

Also see the
[changelog](https://github.com/kensnyder/react-thermals/blob/master/CHANGELOG.md)
and
[roadmap](https://github.com/kensnyder/react-thermals/blob/master/ROADMAP.md).

## Core Concepts

### Properties and Paths

React Thermals supports property names and path expressions in 4 situations:

1. Selecting state inside a component
2. Reading state from the store
3. Creating store actions
4. Updating values in the store

Example of these 4 situations:

```js
// 1. Selecting state from the store (inside a component)
const recipients = useStoreState(store, 'email.recipients');

// 2. Reading state from the store
const recipients = store.getStateAt('email.recipients');

// 3. Creating store actions
appender('email.recipients');

// 4. Updating values in the store
store.setStateAt('email.recipients', recipients);
```

Path expression examples:

- `user` - The value of user property
- `user.name` - The name property on the user object
- `users[2].id` - The id of the 3rd user object
- `users.2.id` - (same as above)
- `users[*].isActive` - The isActive property of every user object
- `users.*.isActive` - (same as above)
- `books[*].authors[*].name` - The name property of every author object within
  every book object

### Selectors

Selectors ensure that components will re-render only when a relevant part of
state changes.

Selectors work the same as selectors work in Redux and you can use libraries
such as [reselect](https://www.npmjs.com/package/reselect) or
[re-reselect](https://www.npmjs.com/package/re-reselect) with React Thermals to
manage selectors. However, as you will see below, React Thermals supports path
expressions and arrays of paths that often remove the need for complex
selectors.

#### Selector examples

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

If your component would like to receive the entire state, you can utilize
`useStoreSate(myStore)` which acts like useStoreSelector but selects the whole
state.

### Immutability

Stores should treat state as immutable. When using path expressions for actions
or calling setStateAt, React Thermals automatically ensures relevant parts of
state are replaced instead of changed. Replacing is more efficient than cloning
the entire state and ensures that components re-render only when replaced parts
of the state change.

Under the hood, React Thermals has an `updatePath()` function that does this
state replacement. The unit test below illustrates a change to a multi-layer
state value, where the resulting state has some changes but keeps unaffected
parts unchanged.

```js
describe('updatePath', () => {
  it('should only update relevant parts of state', () => {
    const state = {
      email: {
        subject: 'hello',
        sender: { id: 3, name: 'Otto' },
        recipients: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Josh' },
        ],
      },
    };
    const addRecipient = updatePath(
      'email.recipients',
      (recipients, newRecipient) => {
        return [...recipients, newRecipient];
      }
    );
    const updated = addRecipient(state, { id: 4, name: 'Lili' });
    expect(updated).not.toBe(state);
    expect(updated.email).not.toBe(state.email);
    expect(updated.email.subject).toBe(state.email.subject);
    expect(updated.email.sender).toBe(state.email.sender);
    expect(updated.email.recipients).not.toBe(state.email.recipients);
    expect(updated.email.recipients[0]).toBe(state.email.recipients[0]);
    expect(updated.email.recipients[1]).toBe(state.email.recipients[1]);
  });
});
```

### Persistence

By default, a store's state value will persist even when all components unmount.
To reset the state instead, add `autoReset: true` to the store definition.

```js
const myPersistingStore = new Store({
  // ...
  autoReset: true,
});
```

## Example usage

React Thermals is designed for multiple use cases:

1. [Example 1: A store with global state](#example-1-a-store-with-global-state)
2. [Example 2: A store used by multiple components](#example-2-a-store-used-by-multiple-components)
3. [Example 3: A store used by one component](#example-3-a-store-used-by-one-component)

### Example 1: A store with global state

We create a store in stores/globalStore/globalStore.js

```js
import { Store, useStoreSelector } from 'react-thermals';
const globalStore = new Store();

export default globalStore;

export function useGlobalStore(selector) {
  return useStoreSelector(globalStore, selector);
}
```

In stores/globalStore/slices/todos.js we extend the store's state with a "todos"
property.

```js
import globalStore, { useGlobalStore } from '../globalStore';
import { persistState, appender, merger, remover } from 'react-thermals';

// extend the state at any time
globalStore.extendState({ todos: [] });

// add actions at any time
export const todoActions = globalStore.addActions({
  addTodo: appender('todos'),
  toggleTodoComplete: merger('todos', todo => ({
    isComplete: !todo.isComplete,
  })),
  removeTodo: remover('todos'),
});

// you can provide a hook for conveniently selecting this state
export function useTodos() {
  // "todos" is equivalent to state => state.todos
  return useGlobalStore('todos');
}
// ...or a hook to select parts of the state
export function useTodoIncompleteCount() {
  return useGlobalStore(state => {
    return state.todos.filter(todo => !todo.isComplete).length;
  });
}

// add plugins to the root store at any time
globalStore.plugin(
  persistState({
    storage: localStorage,
    key: 'myTodos',
    fields: ['todos'],
  })
);
```

In components/Header.jsx we may only care about the TODO incomplete count

```js
import React from 'react';
import { useTodoIncompleteCount } from '../stores/globalStore/slices/todos';

export default function Header() {
  const incompleteCount = useTodoIncompleteCount();
  return (
    <header>
      <h1>My TODO App</h1>
      <div>Tasks remaining: {incompleteCount}</div>
    </header>
  );
}
```

In components/TodoList.jsx we need to render the whole TODO list and provide a
way to toggle completeness and delete a todo

```js
import React from 'react';
import useTodos, { todoActions } from '../stores/globalStore/slices/todos';
import NewTodoForm from './NewTodoForm.jsx';
const { toggleTodoComplete, removeTodo } = todoActions;

export default function TodoList() {
  const todos = useTodos();
  return (
    <ul>
      {todos.map((todo, i) => (
        <li key={i}>
          <input
            type="checkbox"
            checked={todo.isComplete}
            onClick={() => toggleTodoComplete(todo)}
          />
          <span className="text">{todo.text}</span>
          <span onClick={() => removeTodo(todo)}>Delete</span>
        </li>
      ))}
      <li>
        <NewTodoForm />
      </li>
    </ul>
  );
}
```

In components/NewTodoForm.jsx we don't need any state, but we do need to access
the action for adding a TODO.

```js
import React, { useCallback } from 'react';
import { todoActions } from '../stores/globalStore/slices/todos';

export default function NewTodoForm() {
  const addTodoAndClear = useCallback(evt => {
    evt.preventDefault();
    const form = evt.target;
    const data = new FormData(form);
    const newTodo = Object.fromEntries(data);
    newTodo.isComplete = false;
    form.reset();
    todoActions.add(newTodo);
  }, []);
  return (
    <form onSubmit={addTodoAndClear}>
      <input name="text" placeholder="Enter todo..." />
      <button type="submit">Add</button>
    </form>
  );
}
```

In stores/globalStore/slices/auth.js we extend the store's state with a "user"
property.

```js
import axios from 'axios';
import globalStore, { useGlobalStore } from '../../globalStore/globalStore';
import { setterInput } from 'react-thermals';

export function useAuth() {
  return useGlobalStore('user');
}

globalStore.extendState({
  user: {
    isLoggedIn: false,
    isCheckingLogin: false,
  },
});

export const authActions = globalStore.addActions({
  // actions can be async
  async login(form) {
    const formData = Object.fromEntries(new FormData(form));
    globalStore.mergeState({
      user: {
        isLoggedIn: false,
        isCheckingLogin: true,
      },
    });
    const { data } = await axios.post('/api/users/login', formData);
    localStorage.setItem('jwt', data.jwt);
    globalStore.mergeState({
      user: {
        ...data.user,
        isLoggedIn: true,
        isCheckingLogin: false,
      },
    });
  },
});
```

In components/Login/Login.jsx we need to know information about the user and
connect the login action to a form submission.

```js
import { useAuth, authActions } from '../../stores/slices/auth';
import Loader from '../Loader/Loader.jsx';
const { login } = authActions;

export default function Login() {
  const { isCheckingLogin } = useAuth();
  return (
    <div className="LoginComponent">
      {isCheckingLogin ? (
        <Loader />
      ) : (
        <form
          onSubmit={evt => {
            evt.preventDefault();
            login(evt.target);
          }}
        >
          <input name="email" type="input" placeholder="Email" />
          <input name="password" type="password" placeholder="Password" />
          <button type="submit">Login</button>
        </form>
      )}
    </div>
  );
}
```

In components/SubHeader.jsx we might show the user's name or a link to log in.

```js
import React from 'react';
import { useAuth, authActions } from '../stores/slices/auth';

export default function SubHeader() {
  const user = useAuth();
  return (
    <header>
      <h2>My App</h2>
      {user.isLoggedIn ? (
        <span>Hello {user.name}</span>
      ) : (
        <a href="/login">Login</a>
      )}
    </header>
  );
}
```

### Example 2: A store used by multiple components

In src/stores/cartStore.js we define a single store that is only used by the
parts of the application that deal with a shopping cart.

```js
import {
  Store,
  useStoreSelector,
  appender,
  remover,
  setter,
  composeActions,
} from 'react-thermals';

export const cartStore = new Store({
  state: { items: [], discount: 0 },
  actions: {
    add: composeActions([
      appender('items'),
      newItem => {
        axios.post('/api/v1/carts/item', newItem);
      },
    ]),
    remove: composeActions([
      remover('items'),
      oldItem => {
        axios.delete(`/api/v1/carts/items/${oldItem.id}`);
      },
    ]),
    setDiscount: setter('discount'),
  },
});

export const cartActions = store.actions;

export function useCartItems() {
  return useStoreSelector(cartStore, 'items');
}

export function useCartItemCount() {
  return useStoreSelector(cartStore, state => state.items.length);
}

export function useCartTotal() {
  return useStoreSelector(cartStore, state => {
    let total = 0;
    state.items.forEach(item => {
      total += item.quantity * item.price * (1 - state.discount);
    });
    return total;
  });
}
```

In components/Header.jsx we may want to show how many items are in the cart

```js
import React from 'react';
import { useCartItemCount } from '../stores/cartStore';

export default function Header() {
  // only re-render when cart item count changes
  const itemCount = useCartItemCount();
  return (
    <header>
      <h1>My App</h1>
      <a href="/cart">
        Shopping Cart: {itemCount} {itemCount === 1 ? 'item' : 'items'}
      </a>
    </header>
  );
}
```

In components/CartDetails.jsx we need the items, the total, and a way to remove
an item from the cart.

```js
import React from 'react';
import { useCartItems, useCartTotal, cartActions } from '../stores/cartStore';

export default function CartDetails() {
  // only re-render when list or total changes
  const items = useCartItems();
  const total = useCartTotal();
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          {item.name}: ${item.price.toFixed(2)}{' '}
          <button onClick={() => cartActions.remove(item)}>Delete</button>
        </li>
      ))}
      <li>Total: ${total.toFixed(2)}</li>
    </ul>
  );
}
```

In components/Product.jsx we don't need info about the cart, but we may need to
add an item to the cart.

```js
import React from 'react';
import { cartActions } from '../stores/cartStore';

export default function Product({ product }) {
  return (
    <div>
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <p>${product.price.toFixed(2)}</p>
      <button onClick={() => cartActions.add(product)}>Add to cart</button>
    </div>
  );
}
```

In stores/cartStore.spec.js we can test that actions change state in the correct
way and test any side effects like an http request.

```js
import axios from 'axios';
import { cartStore } from './cartStore';

jest.mock('axios');

describe('cartStore', () => {
  let store;
  beforeEach(() => {
    store = cartStore.clone();
  });
  it('should add item', () => {
    const item = { id: 123, name: 'Pencil', price: 2.99 };
    store.actions.add(item);
    store.flushSync();
    expect(store.getState().items[0]).toBe(item);
    expect(axios.post).toHaveBeenCalledWith('/api/v1/carts/item', item);
  });
  it('should remove item', () => {
    const item = { id: 123, name: 'Pencil', price: 2.99 };
    store.setStateAt('items', [item]);
    store.actions.remove(item);
    store.flushSync();
    expect(store.getState().items).toEqual([]);
    expect(axios.delete).toHaveBeenCalledWith(`/api/v1/carts/items/${item.id}`);
  });
});
```

### Example 3: A store used by one component

Even if a store is only used by one component, it can be a nice way to separate
concerns.

In components/Game/gameStore.ts

```ts
import { Store, useStoreState } from 'react-thermals';
import random from 'random-int';

export const gameStore = new Store({
  state: {
    board: {
      user: { x: 0, y: 0 },
      flag: { x: random(1, 10), y: random(1, 10) },
    },
    hasWon: false,
  },
  actions: {
    restart(): void {
      gameStore.reset();
      gameStore.setStateAt('board.flag', {
        x: random(1, 10),
        y: random(1, 10),
      });
    },
    moveBy(x: number, y: number): void {
      gameStore.setSyncAt('board.user', (old: Record<string, number>) => ({
        x: old.x + x,
        y: old.y + y,
      }));
      const { user, flag } = gameStore.getStateAt('board');
      if (flag.x === user.x && flag.y === user.y) {
        gameStore.mergeSync({ hasWon: true });
      }
    },
  },
  autoReset: true,
});

export function useGameState() {
  return useStoreState(gameStore);
}
```

In components/Game/Game.tsx

```tsx
import React from 'react';
import range from '../range';
import './Game.css';
import { gameStore, useGameState } from './gameStore';
const { restart, moveBy } = gameStore.actions;

export default function Game(): React.Element {
  const state = useGameState();

  return (
    <div className="Game">
      <h1>Hop to the flag</h1>
      <div className="board">
        {range(11).map((x: number) => (
          <div key={`x-${x}`} className="row">
            {range(11).map((y: number) => (
              <div key={`y-${y}`} className="cell">
                {state.board.user.x === x && state.board.user.y === y
                  ? '🐸'
                  : state.board.flag.x === x &&
                    state.board.flag.y === y &&
                    '⛳️'}
              </div>
            ))}
          </div>
        ))}
      </div>
      {state.hasWon ? (
        <div className="you-win">
          You win!
          <button onClick={restart}>New game</button>
        </div>
      ) : (
        <div className="controls">
          <button onClick={() => moveBy(0, -1)}>←</button>
          <button onClick={() => moveBy(-1, 0)}>↑</button>
          <button onClick={() => moveBy(1, 0)}>↓</button>
          <button onClick={() => moveBy(0, 1)}>→</button>
        </div>
      )}
    </div>
  );
}
```

## Action Functions

### Writing Actions

For most actions, you can use action creators as introduced in the next
section and as documented [here](src/actions/README.md).

`store.setState` works exactly like a setter function from a `useState()` pair.
`store.mergeState` works similarly, except the store will merge current state
with the partial state passed to mergeState--with the assumption that the
current state and new state are both plain objects.

Calling `state.setState` will trigger a rerender on all components that consume
the whole state and components that consume selected state that changes.

Note that by default, state persists even when all consumers have unmounted.
The effect is similar to having a global state that your top level `<App />`
consumes. To disable persistence, create the state with `autoReset` set to
`true`.

Many cross-component state patterns like Redux do not have built-in ways to code
split. In React Thermals, code splitting happens naturally because components
must `import` any stores they want to consume.

React Thermals is useful for a) global state, b) state that goes across
components and c) state that is local to a single component.

### Action creators

For common types of state changes, React Thermals has 7 functions that will
create action functions. Supported state changes are:

1. [Set a single value](src/actions/README.md#setter)
2. [Toggle a boolean value](src/actions/README.md#toggler)
3. [Append an item to a list](src/actions/README.md#appender)
4. [Remove an item from a list](src/actions/README.md#remover)
5. [Replace an item in a list](src/actions/README.md#replacer)
6. [Add to or subtract from a number](src/actions/README.md#adder)
7. [Merge one object into another](src/actions/README.md#merger)

There are also two functions for combining action functions:

1. [composeActions(actions)](src/actions/README.md#composeactions) - Run multiple
   actions where one action doesn't depend on the changes from another
2. [pipeActions(actions)](src/actions/README.md#pipeactions) - Run multiple
   actions in sequence where one state change depends on another

[Full docs](src/actions/README.md) on action creators.

### Action Batching

Actions are batched by default. Meaning state changes are put into a queue until
the next event loop. Since React rendering is also batched, actions work pretty
intuitively.

If you want to immediately flush the queue, you can call `store.flushSync()`.
If any parts of the state returned `Promise`s, there will be an additional
update after each `Promise`s resolves. See the next section for more information
on `Promise`s.

### Asynchronous Actions

When `setState()` receives a promise or a function that returns a promise,
React Thermals will automatically await that value. If more than one promise
is batched for changes, they will be awaited serially, such that a promise
operates on the post-promise state; and re-renders will not be triggered until
all batched promises have resolved.

## Full Documentation

### All Store Options

The `Store()` constructor takes an object with the following properties:

- {Object} state - The store's initial state. It can be of any type.
- {Object} actions - Named functions that can be dispatched by name and arguments.
- {Object} options - Options that setters, plugins or event listeners might look for
- {Boolean} autoReset - If true, reset the store when all consumer components
  unmount (default false)
- {String} id - An identifier that could be used by plugins or event listeners
- {Object} on - Immediately add event handlers without calling `store.on(event, handler)`

### Common Store Methods

| Method                      | Description                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| extendState(moreState)      | Extend state to a store after it has been instantiated. Useful for global stores.         |
| addActions(actions)         | Add action functions to a store after it has been instantiated. Useful for global stores. |
| setState(valueOrFn)         | In an action function: set the store's state                                              |
| setStateAt(path, valueOrFn) | In an action function: set the store's state at the given path                            |
| setSync(valueOrFn)          | In an action function: set the store's state (synchronously)                              |
| setSyncAt(path, valueOrFn)  | In an action function: set the store's state at the given path (synchronously)            |
| mergeState(valueOrFn)       | In an action function: extend the store's state                                           |
| mergeSync(valueOrFn)        | In an action function: extend the store's state (synchronously)                           |
| flushSync()                 | Run queued updates immediately                                                            |
| on(type, handler)           | Register a handler to be called for the given event type                                  |
| off(type, handler)          | De-register a handler for the given event type                                            |
| once(type, handler)         | Register a handler to be called ONCE for the given event type                             |
| plugin(initializer)         | Register a plugin                                                                         |
| use(...middlewares)         | Register one or more middlewares                                                          |

### Other Store Methods

| Method                 | Description                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| getState()             | Get state. Generally your action functions should use store.setState(old => { ... })                 |
| getStateAt(path)       | Get state at path. Generally your action functions should use store.setStateAt(path, old => { ... }) |
| clone(withOverrides)   | Create a clone of this store, including plugins but excluding event listeners. Useful for unit tests |
| reset(withOverrides)   | Reset store state (cancelable by BeforeReset event)                                                  |
| nextState()            | Return a promise that resolves when queued updates finish running                                    |
| hasInitialized()       | True if any component has ever used this store (but may not have mounted yet)                        |
| getOptions()           | Get all options that may have been set by a plugin                                                   |
| getOption(name)        | Get an option that may have been set by a plugin                                                     |
| setOptions(options)    | Set options from the given object. May be used by plugins                                            |
| setOption(name, value) | Set an option with the given name. May be used by plugins                                            |
| getMountCount()        | Get the number of mounted components that us this store with useStoreState() or useStoreSelector()   |
| getPlugins()           | Get the list of initializer functions registered as plugins                                          |

## Best Practices

### Code splitting

A store can be global or used by a number of components. Regardless, each
component must import the store; that way, any components loaded from
`React.lazy` will allow automatic code splitting.

A global store can be extended at any time (using `store.addActions(actions)` for
new actions and `store.extendState()` for new state), so a global store can be
defined in one file but only extended when needed by a component.

### Suggested File Structure

For global or shared stores, e.g. a theme store:

- src/stores/theme/themeStore.js
- src/stores/theme/themeStore.spec.js

For reusable components or pages with private state, e.g. a header:

- src/components/Header/Header.jsx
- src/components/Header/Header.spec.jsx
- src/components/Header/store/headerStore.js
- src/components/Header/store/headerStore.spec.js

### Testing stores

Stores can be easily unit tested inside or outside a React Component.

#### Unit Test Examples

```js
import myStore from './myStore';

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

## Extending Store Behavior

### Events

Stores fire a series of lifecycle events. For example:

```js
store.on('BeforeFirstUse', () => {
  store.setSync({ my: 'external', initial: 'state' });
});
store.on('BeforeUpdate', evt => {
  if (evt.data.name.length < 4) {
    alert('name must be at least 4 characters');
    evt.preventDefault();
  }
});
```

#### Event description & Cancellability

The following events fire during the life cycle of the store. Some events allow
you call `event.preventDefault()` to block the next step. For example,
cancelling the BeforeSet event will block all pending state updates. Handlers
can also call `event.stopPropagation()` to block other handlers from receiving
this particular event.

| Event            | Description                                                 | Cancellable? |
| ---------------- | ----------------------------------------------------------- | ------------ |
| BeforeFirstUse   | Can alter initial state for first component that uses state | No           |
| AfterFirstUse    | Fires after store has been used by the first time           | No           |
| AfterFirstMount  | Fires after first component mounts                          | No           |
| AfterMount       | Fires after each component mounts                           | No           |
| AfterUnmount     | Fires after each component unmounts                         | No           |
| AfterLastUnmount | Fires when last component unmounts                          | No           |
| SetterException  | Fires if a setter function throws an exception              | No           |
| BeforeSet        | Fires before any queued setter functions run                | Yes          |
| BeforeUpdate     | Fires before newly calculated state is propagated           | Yes          |
| AfterUpdate      | Fires after state is finalized but before React re-renders  | Yes          |
| BeforeReset      | Fires before state is reset (by reset() or by autoReset)    | Yes          |
| AfterReset       | Fires after state is reset (by reset() or by autoReset)     | Yes          |
| BeforePlugin     | Fires before a plugin is registered                         | Yes          |
| AfterPlugin      | Fires after a plugin is registered                          | No           |

#### Event data

Each event comes with a `data` property. Below is the available data for each event that carries some.
Note the "Editable?" column which indicates events where altering event.data or its sub properties
will affect what happens next

| Event            | event.data property                                        | Editable?  |
| ---------------- | ---------------------------------------------------------- | ---------- |
| BeforeFirstUse   | The initial state (used by plugins to load persisted data) | data       |
| AfterFirstUse    | null                                                       | N/A        |
| AfterFirstMount  | null                                                       | N/A        |
| AfterMount       | null                                                       | N/A        |
| AfterUnmount     | null                                                       | N/A        |
| AfterLastUnmount | null                                                       | N/A        |
| SetterException  | The Error object                                           | No         |
| BeforeSet        | Previous state                                             | No         |
| BeforeUpdate     | ({ prev, next }) => previous state and next state          | data.next  |
| AfterUpdate      | ({ prev, next }) => previous state and next state          | No         |
| BeforeReset      | ({ before, after }) => state before and after the reset    | data.after |
| AfterReset       | ({ before, after }) => state before and after the reset    | No         |
| BeforePlugin     | The plugin's initializer function (with name property)     | No         |
| AfterPlugin      | The plugin's initializer function (with name property)     | No         |

### Plugins

The suite of events above allows powerful behavior using plugins. There are 5
included plugins:

1. [consoleLogger](src/plugins/README.md#consolelogger) - Logs state changes to
   the console
2. [observable](src/plugins/README.md#observable) - Adds a subscribe function to
   observe the store as an observable subject
3. [persistState](src/plugins/README.md#persiststate) - Persists state to
   localStorage or sessionStorage
4. [syncUrl](src/plugins/README.md#syncurl) - Persists state to URL using
   the history API
5. [undo](src/plugins/README.md#undo) - Adds undo and redo capability to the
   store

See examples of using [these plugins](src/plugins/README.md).

Interested in writing your own plugins? Check out
[how to write plugins](src/plugins/README.md#how-to-write-plugins).

### Middleware

React Thermals has a simple middleware system. Often it is simpler to just
subscribe to the `BeforeUpdate` event, but middleware is more intuitive in
some circumstances.

Middleware examples:

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
  context.next = mockStore.nextState();
  next();
});

// call next asynchronously
myStore.use((context, next) => {
  debounceState(context.next, next);
});
```

## Community

### Contributing

Contributions welcome! Please see
[our Contributor Covenant Code of Conduct](https://github.com/kensnyder/react-thermals/blob/master/CONTRIBUTING.md).

### ISC License

[View here](https://opensource.org/licenses/ISC)

### Credits

Inspired by
[@jhonnymichel's react-hookstore](https://github.com/jhonnymichel/react-hookstore/blob/6d23d2fcb0e7cf8a3929a01e0c543fe5e05ecf05/src/index.js)

Why start at version 4? React Thermals is an evolution of
[react-create-use-store version 3](https://npmjs.com/package/react-create-use-store).