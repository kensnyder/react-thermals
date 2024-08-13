<img alt="React Thermals Logo" src="https://github.com/kensnyder/react-thermals/raw/main/assets/glider-logotype.png?v=4.0.1-beta.27" height="64" />

[![NPM Link](https://badgen.net/npm/v/react-thermals?v=4.0.1)](https://npmjs.com/package/react-thermals)
[![Language](https://badgen.net/static/language/TS?v=4.0.1)](https://github.com/search?q=repo:kensnyder/react-thermals++language:TypeScript&type=code)
[![Build Status](https://github.com/kensnyder/react-thermals/actions/workflows/workflow.yml/badge.svg?v=4.0.1)](https://github.com/kensnyder/react-thermals/actions)
[![Code Coverage](https://codecov.io/gh/kensnyder/react-thermals/branch/main/graph/badge.svg?v=4.0.1)](https://codecov.io/gh/kensnyder/react-thermals)
[![Gzipped Size](https://badgen.net/bundlephobia/minzip/react-thermals?label=minzipped&v=4.0.1)](https://bundlephobia.com/package/react-thermals@4.0.1)
[![Dependency details](https://badgen.net/bundlephobia/dependency-count/react-thermals?v=4.0.1)](https://www.npmjs.com/package/react-thermals?activeTab=dependencies)
[![Tree shakeable](https://badgen.net/bundlephobia/tree-shaking/react-thermals?v=4.0.1)](https://www.npmjs.com/package/react-thermals)
[![ISC License](https://badgen.net/github/license/kensnyder/react-thermals?v=4.0.1)](https://opensource.org/licenses/ISC)

React Thermals is a simple and type-safe way to manage shared state in React

```bash
npm install react-thermals
```

## Table of contents

1. [Features](#features)
   1. [Changelog](https://github.com/kensnyder/react-thermals/blob/master/CHANGELOG.md)
   1. [Roadmap](https://github.com/kensnyder/react-thermals/blob/master/ROADMAP.md)
2. [Core concepts](#features)
   1. [Properties and paths](#properties-and-paths)
   2. [Selectors](#selectors)
   3. [Immutability](#immutability)
   4. [Persistence](#persistence)
3. [Example usage](#example-usage)
   1. [Example 1: A store used by multiple components](#example-1-a-store-used-by-multiple-components)
   2. [Example 2: A store used by one component](#example-2-a-store-used-by-one-component)
   3. [Example 3: A store with global state](#example-3-a-store-with-global-state)
4. [Action functions](#action-functions)
   1. [Writing actions](#writing-actions)
   2. [Action creators](#action-creators)
   3. [Action batching](#action-batching)
   4. [Asynchronous actions](#asynchronous-actions)
   5. [Synchronous actions](#synchronous-actions)
5. [Strongly typed state](#strongly-typed-state)
   1. [TypeScript definitions](#typescript-definitions)
6. [Store class documentation](#store-class-documentation)
   1. [Constructor](#constructor)
   2. [State Setters](#state-setters)
   3. [State Getters](#state-getters)
   4. [Most common store methods](#most-common-store-methods)
   5. [Other store methods](#other-store-methods)
7. [Best Practices](#best-practices)
   1. [Code splitting](#code-splitting)
   2. [Suggested file structure](#suggested-file-structure)
   3. [Testing stores](#testing-stores)
8. [Extending store behavior](#extending-store-behavior)
   1. [Events](#events)
   2. [Plugins](#plugins)
   3. [Middleware](#middleware)
9. [Community](#community)
   1. [Contributing](#contributing)
   2. [ISC license](#isc-license)
   3. [Credits](#credits)

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
10. Store state is strongly typed using TypeScript Generics
11. Stores can respond to component lifecycle events including unmount
    (e.g. to abort fetching data)
12. No Context Provider components are needed in `<App />` or elsewhere

Also see the
[changelog](https://github.com/kensnyder/react-thermals/blob/master/CHANGELOG.md)
and
[roadmap](https://github.com/kensnyder/react-thermals/blob/master/ROADMAP.md).

## Core Concepts

### Properties and Paths

React Thermals supports property names and path expressions in 4 use cases:

1. Selecting state inside a component
2. Updating values in the store
3. Creating store actions
4. Reading state from the store (uncommon)

Example of these 4 use cases:

```js
// 1. Selecting state from the store (inside a component)
const recipients = useStoreState(store, 'email.recipients');

// 2. Updating values in the store
store.setStateAt('email.recipients', recipients);

// 3. Creating store action functions
const addRecipient = store.connect('email.recipients', appender());

// 4. Reading state from the store (uncommon)
const recipients = store.getStateAt('email.recipients');
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
// 2 ways to select the value of a single field
const todos = useStoreSelector(myStore, state => state.todos);
const todos = useStoreSelector(myStore, 'todos');

// 2 ways to select a deeper value
const userId = useStoreSelector(myStore, state => state.user.id);
const userId = useStoreSelector(myStore, 'user.id');

// 2 ways to select a list of deeper values
const bookIds = useStoreSelector(myStore, state => state.books.map(b => b.id));
const bookIds = useStoreSelector(myStore, 'books[*].id');

// 2 ways to select multiple fields using an array
const [sender, recipients] = useStoreSelector(myStore, [
  state => state.sender,
  state => state.recipients,
]);
const [sender, recipients] = useStoreSelector(myStore, [
  'sender',
  'recipients',
]);

// 2 ways to select multiple deeper values using an array
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
state. Note that your component will re-render any time any part of the state
changes.

#### TypeScript goodness

Thanks to [Sindre Sorhus's](https://www.npmjs.com/~sindresorhus) awesome
[type-fest](https://npmjs.com/package/type-fest) package, you will get
autocomplete, type inference, and type checking on methods that have a
`path` argument (getStateAt, setStateAt, mergeStateAt, resetStateAt).

Example:

```ts
// (react thermals will infer type if not given)
type GlobalSchemaType = {
  hello?: {
    world: number;
  };
  foo?: string;
};
const initialState: GlobalSchemaType = { hello: { world: 42 } };
const store = new Store(initialState);
store.mergeState({ foo: 'bar' });
store.getStateAt('hello.world'); // TypeScript knows return value is number
store.setStateAt('hello.world', 'me'); // TypeScript knows "me" is invalid
store.setStateAt('hello.world', () => 'me'); // TypeScript knows "me" is invalid
store.setStateAt('foo', () => 42); // TypeScript knows 24 is invalid
```

However, note that when your path contains an asterisk, TypeScript will not
understand that the preceding element is an array.

### Immutability

Stores should treat state as immutable. When using path expressions for actions
or calling `setStateAt`, React Thermals automatically ensures relevant parts of
state are replaced instead of changed. Replacing is more efficient than cloning
the entire state and ensures that components re-render only when replaced parts
of the state change.

Under the hood, React Thermals has a `replacePath(path, value)` function
that performs this state replacement. The unit test below illustrates a change
to a multi-layer state value, where the resulting state has some changes but
keeps unaffected parts unchanged.

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
    const newRecipient = { id: 4, name: 'Lili' };
    const updated = addRecipient(state, newRecipient);
    expect(updated).not.toBe(state); // different object
    expect(updated.email).not.toBe(state.email); // different object
    expect(updated.email.subject).toBe(state.email.subject); // same value
    expect(updated.email.sender).toBe(state.email.sender); // same object!
    expect(updated.email.recipients).not.toBe(state.email.recipients);
    expect(updated.email.recipients[0]).toBe(state.email.recipients[0]); // same object!
    expect(updated.email.recipients[1]).toBe(state.email.recipients[1]); // same object!
    expect(updated.email.recipients[2]).toBe(newRecipient); // our newly added recipient
  });
});
```

### Persistence

By default, a store's state value will persist even when all consumer components
unmount. To reset the state instead, add `autoReset: true` to the store
definition and the state will automatically revert back to its initial value
after all components unmount.

```js
const autoResettingStore = new Store(initialState, {
  // ...
  autoReset: true,
});
```

## Example usage

React Thermals is designed for multiple use cases:

1. [Example 1: A store used by multiple components](#example-1-a-store-used-by-multiple-components)
2. [Example 2: A store used by one component](#example-2-a-store-used-by-one-component)
3. [Example 3: A store with global state](#example-3-a-store-with-global-state)

### Example 1: A store used by multiple components

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

const store = new Store({
  items: [],
  discount: 0,
});

export const addToCart = store.connect(
  composeActions([
    appender('items'),
    newItem => {
      axios.post('/api/v1/carts/item', newItem);
    },
  ])
);

export const removeFromCart = store.connect(
  composeActions([
    remover('items'),
    oldItem => {
      axios.delete(`/api/v1/carts/items/${oldItem.id}`);
    },
  ])
);

export const setDiscount = store.connect('discount', setter());

export function useCartItems() {
  return useStoreSelector(store, 'items');
}

export function useCartItemCount() {
  return useStoreSelector(store, state => state.items.length);
}

export function useCartTotal() {
  return useStoreSelector(store, state => {
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
import {
  useCartItems,
  useCartTotal,
  removeFromCart,
} from '../stores/cartStore';

export default function CartDetails() {
  // only re-render when list or total changes
  const items = useCartItems();
  const total = useCartTotal();
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          {item.name}: ${item.price.toFixed(2)}{' '}
          <button onClick={() => removeFromCart(item)}>Delete</button>
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
import { addToCart } from '../stores/cartStore';

export default function Product({ product }) {
  return (
    <div>
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <p>${product.price.toFixed(2)}</p>
      <button onClick={() => addToCart(product)}>Add to cart</button>
    </div>
  );
}
```

In stores/cartStore.spec.js we can test that actions change state in the correct
way and test any side effects like an http request.

```js
import axios from 'axios';
import { default as cartStore } from './cartStore';

jest.mock('axios');

describe('cartStore', () => {
  let store;
  beforeEach(() => {
    store = cartStore.clone();
  });
  it('should add item', async () => {
    const item = { id: 123, name: 'Pencil', price: 2.99 };
    store.actions.add(item);
    await store.nextState();
    expect(store.getState().items[0]).toBe(item);
    expect(axios.post).toHaveBeenCalledWith('/api/v1/carts/item', item);
  });
  it('should remove item', async () => {
    const item = { id: 123, name: 'Pencil', price: 2.99 };
    store.setStateAt('items', [item]);
    store.actions.remove(item);
    await store.nextState();
    expect(store.getState().items).toEqual([]);
    expect(axios.delete).toHaveBeenCalledWith(`/api/v1/carts/items/${item.id}`);
  });
});
```

### Example 2: A store used by one component

Even if a store is only used by one component, it can be a nice way to separate
concerns. And the store object itself doesn't necessarily need to be exported.
You might want your application to interact with the store only through hooks
and functions exported by your store file.

In components/Game/gameStore.ts

```ts
import { Store, useStoreState } from 'react-thermals';
import random from 'random-int';

const store = new Store({
  board: {
    user: { x: 0, y: 0 },
    flag: { x: random(1, 10), y: random(1, 10) },
  },
  hasWon: false,
});

export function restart() {
  store.reset();
  store.setStateAt('board.flag', {
    x: random(1, 10),
    y: random(1, 10),
  });
}

export function moveBy(x: number, y: number): void {
  store.setStateAt('board.user', old => ({
    x: old.x + x,
    y: old.y + y,
  }));
  const { user, flag } = store.getStateAt('board');
  if (flag.x === user.x && flag.y === user.y) {
    store.mergeState({ hasWon: true });
  }
}

export function useGameState() {
  return useStoreState(store);
}
```

In components/Game/Game.tsx

```tsx
import React from 'react';
import range from '../range';
import './Game.css';
import { useGameState, restart, moveBy } from './gameStore';

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

### Example 3: A store with global state

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
globalStore.mergeState({ todos: [] }, { bypassAll: true });

// add actions at any time
export const addTodo = globalStore.connect('todos', appender());
export const replaceTodo = globalStore.connect('todos', replacer());
export const removeTodo = globalStore.connect('todos', remover());

// you can provide a hook for conveniently selecting this state
export function useTodos() {
  // The string 'todos' is equivalent to state => state.todos
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
      <h1>My Tasks</h1>
      <div>Tasks remaining: {incompleteCount}</div>
    </header>
  );
}
```

In components/TodoList.jsx we need to render the whole TODO list and provide a
way to toggle completeness and delete a todo

```js
import React from 'react';
import useTodos, {
  toggleTodoComplete,
  removeTodo,
} from '../stores/globalStore/slices/todos';
import NewTodoForm from './NewTodoForm.jsx';

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
import { addTodo } from '../stores/globalStore/slices/todos';

export default function NewTodoForm() {
  const addTodoAndClear = useCallback(evt => {
    evt.preventDefault();
    const form = evt.target;
    const data = new FormData(form);
    const newTodo = Object.fromEntries(data);
    newTodo.isComplete = false;
    form.reset();
    addTodo(newTodo);
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

globalStore.replaceState(old => ({
  ...old,
  user: {
    isLoggedIn: false,
    isCheckingLogin: false,
  },
}));

// actions can be async
export async function login(form) {
  const formData = Object.fromEntries(new FormData(form));
  globalStore.setStateAt('user', {
    isLoggedIn: false,
    isCheckingLogin: true,
  });
  const { data } = await axios.post('/api/users/login', formData);
  localStorage.setItem('jwt', data.jwt);
  globalStore.mergeStateAt('user', {
    ...data.user,
    isLoggedIn: true,
    isCheckingLogin: false,
  });
}
```

In components/Login/Login.jsx we need to know information about the user and
connect the login action to a form submission.

```js
import { useAuth, login } from '../../stores/slices/auth';
import Loader from '../Loader/Loader.jsx';

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
import { useAuth } from '../stores/slices/auth';

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

## Action Functions

### Writing Actions

For many actions, you can use action creators as introduced in the next
section and as documented [here](src/actions/README.md).

Otherwise, you have the following building blocks to write your own actions.
`store.setState` works exactly like a setter function from a `useState()` pair.
`store.mergeState` works similarly, except the store will merge current state
with the partial state passed to mergeState--with the assumption that the
current state and new state are both Arrays or both plain Objects.

Calling `state.setState` will trigger a re-render on all components that consume
the whole state and components that consume selected state that changes.

Note that by default, state persists even when all consumers have unmounted.
The effect is similar to having a global state that your top level `<App />`
consumes. To disable persistence, create the state with `autoReset` set to
`true`.

Many cross-component state patterns like Redux do not have built-in ways to code
split. In React Thermals, code splitting happens naturally because components
must `import` any stores they want to consume.

### Action creators

For common types of state changes, React Thermals has several functions that
will create action functions. Supported state changes are:

1. [setter(path)](src/actions/README.md#setter) - Set a single value
2. [toggler(path)](src/actions/README.md#toggler) - Toggle a boolean value
3. [appender(path)](src/actions/README.md#appender) - Append an item to a list
4. [remover(path)](src/actions/README.md#remover) - Remove an item from a list
5. [replacer(path)](src/actions/README.md#replacer) - Replace an item in a list (i.e. edit)
6. [adder(path)](src/actions/README.md#adder) - Add to or subtract from a number
7. [merger(path)](src/actions/README.md#merger) - Merge one object into another
8. [fetcher({ path, url, init, extractor })](src/actions/README.md#fetcher) - Fetch and store data from an API

There are also two functions for combining action functions:

1. [composeActions(actions)](src/actions/README.md#composeactions) - Run
   multiple actions where one action doesn't depend on the changes from another
2. [pipeActions(actions)](src/actions/README.md#pipeactions) - Run multiple
   actions in sequence where one action's change depends on another

[Full docs](src/actions/README.md) on action creators.

### Asynchronous Actions

When a setter function receives a promise or a function that returns a promise,
React Thermals will automatically await that value. If more than one promise
is batched for changes, they will be awaited serially, such that a promise
operates on the resolved state of the previous promise; and re-renders will
not be triggered until all batched promises have resolved.

Keep in mind that middleware may perform further state changes synchronously or
asynchronously.

You can use `await store.nextState()` to take action when the next state is
resolved and all affected components have been re-rendered.

### Synchronous Actions

When a setter function receives a value or a function that returns a value,
React Thermals will synchronously trigger a re-render.

Keep in mind that a middleware that executes asynchronously will make all
actions asynchronous. That could be a problem, for example, if an action
responds to an `<input onChange={action} />` event where the user's keyboard
cursor will not work as intended unless re-renders are synchronous. In that
case, be sure that all middleware is synchronous.

## Store Class Documentation

### Constructor

`new Store(state, options)` takes an `options` object with the following properties:

- **autoReset** _boolean_ - If true, reset the store when all consumer components
  unmount (default false)
- **id** _string_ - An identifier that could be used by plugins or event listeners

### State Setters

The following state setters will cause a change and re-render all components
that subscribe to affected state.

| Action | Update whole state         | Update state at path               |
| ------ | -------------------------- | ---------------------------------- |
| Set    | setState(value, options)   | setStateAt(path, value, options)   |
| Merge  | mergeState(value, options) | mergeStateAt(path, value, options) |
| Reset  | resetState(options)        | resetStateAt(value, options)       |
| Init   | initState(options)         | initStateAt(value, options)        |

The `value` parameter supports values, promises, functions that return values,
and functions that return promises.

Examples:

```js
store.setState(42);
store.setState(old => old + 42);
store.setState(Promise.resolve(42));
store.setState(old => Promise.resolve(old + 42));
```

#### Bypassing middleware, rendering and AfterUpdate event

The `options` parameter allows you to replace the state value without the usual
effects. This can be useful for plugins or testing, but not generally
necessary.

That options object has up to 4 properties:

1. `bypassRender` - If true, do not notify components of the change.
2. `bypassMiddleware` - If true, skip any registered middleware.
3. `bypassEvent` - If true, an AfterUpdate event will not be emitted.
4. `bypassAll` - If true, bypass all three of the effects above.

```js
store.setState(newState, {
  bypassRender: true,
  bypassMiddleware: true,
  bypassEvent: true,
});
```

Which is the same as:

```js
store.setState(newState, {
  bypassAll: true,
});
// OR
store.initState(newState);
```

### Most Common Store Methods

| Method              | Description                                                |
| ------------------- | ---------------------------------------------------------- |
| nextState()         | Return a promise that resolves after the next state change |
| reset()             | Reset store to its original condition and original state   |
| use(...middlewares) | Register one or more middlewares                           |

### Other Store Methods

| Method               | Description                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| clone(withOverrides) | Create a clone of this store, including plugins but excluding event listeners. Useful for unit tests |
| hasInitialized()     | True if any component has ever used this store (but may not have returned JSX yet)                   |
| getMountCount()      | Get the number of mounted components that us this store with useStoreState() or useStoreSelector()   |
| on(type, handler)    | Register a handler to be called for the given event type (see [events docs](#events))                |
| off(type, handler)   | De-register a handler for the given event type                                                       |
| once(type, handler)  | Register a handler to be called ONCE for the given event type                                        |
| plugin(initializer)  | Register a plugin                                                                                    |
| getPlugins()         | Get the list of initializer functions registered as plugins                                          |

### State Getters

Generally you'll want to avoid getting the current state. Components should only
access state using `useStoreState`/`useStoreState`. Functions that update the
store should preferably pass a callback to a state setter function.

If you do need to directly set state, you have 4 choices:

| Get           | Whole state       | State at path           |
| ------------- | ----------------- | ----------------------- |
| Current State | getState()        | getStateAt(path)        |
| Initial State | getInitialState() | getInitialStateAt(path) |

Example:

```js
const store = new Store(21);

// ✅ preferred
store.setState(old => old * 2);

// ❌ discouraged but still works in most cases
store.setState(store.getState() * 2);
```

Components should normally access state only through one of two hooks:

1. `useStoreSelector(selector)` - Select part of or a computed part of the
   state, re-rendering any time that portion changes.
2. `useStoreState(store)` - Select the whole state, re-rendering any time any
   part of the state changes.

And you'll also notice that all the examples in this README do not actually
export the store at all; you can export hooks that call `useStoreState()` or
`useStoreSelector()` internally.

## Best Practices

### Code splitting

A store can be global or used by a number of components. Regardless, each
component must import the store; that way, any components loaded from
`React.lazy` will allow automatic code splitting.

A global store can be extended at any time using `store.replaceState()`
so a global store can be defined in one file and only extended when
needed by another feature.

### Suggested File Structure

For global or shared stores, e.g. a theme store:

- src/stores/theme/themeStore.js
- src/stores/theme/themeStore.spec.js

For reusable components or pages with private stores, e.g. a header:

- src/components/Header/Header.jsx
- src/components/Header/Header.spec.jsx
- src/components/Header/headerStore.js
- src/components/Header/headerStore.spec.js

### Testing stores

Stores can be easily unit tested inside or outside a React Component.

#### Unit Test Examples

```js
import myStore, { addToCart } from './myStore';

describe('myStore', () => {
  it('should add to cart with addToCart(item)', async () => {
    myStore.setState({ cart: [], total: 0 });
    addToCart({
      id: 101,
      name: 'White Shoe',
      cost: 123,
    });
    const next = await myStore.nextState();
    expect(next).toEqual({
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
store.on('BeforeInitialize', () => {
  // The following adds values to the store but uses bypassAll to avoid re-render
  store.mergeState({ my: 'external', initial: 'state' }, { bypassAll: true });
});
store.on('AfterLastUnmount', evt => {
  // cancel side effects such as http requests
  cancelPendingStuff();
});
```

#### List of events

The following events fire during the life cycle of the store.

| Event            | Description                                                         |
| ---------------- | ------------------------------------------------------------------- |
| BeforeInitialize | Allows changing initial state before first component sees the state |
| AfterInitialize  | Fires after the first component sees the state                      |
| BeforeFirstUse   | Fires after initialization but before being used for the first time |
| AfterFirstUse    | Fires after store has been used by the first time                   |
| AfterFirstMount  | Fires after first component mounts                                  |
| AfterMount       | Fires after each component mounts                                   |
| AfterUnmount     | Fires after each component unmounts                                 |
| AfterUpdate      | Fires after each update to state                                    |
| AfterLastUnmount | Fires when last component unmounts                                  |
| SetterRejection  | Fires if a setter function throws an exception                      |

#### Event data

Note that some events have a `data` property. Below is the available data for
events that support it.

| Event            | event.data property                                        |
| ---------------- | ---------------------------------------------------------- |
| BeforeInitialize | The initial state (used by plugins to load persisted data) |
| AfterInitialize  | The state value after initialization                       |
| BeforeFirstUse   | The state value                                            |
| AfterFirstUse    | The state value                                            |
| AfterMount       | The number of components currently mounted                 |
| AfterUnmount     | The number of components currently mounted                 |
| AfterUpdate      | { prev: previous state, next: new state }                  |
| SetterRejection  | The Error object                                           |

### Plugins

The suite of events above allows powerful behavior using plugins. There are 5
included plugins:

1. [consoleLogger](src/plugins/README.md#consolelogger) - Logs state changes to
   the console
2. [observable](src/plugins/README.md#observable) - Adds a `subscribe()`
   function to observe the store as an Observable Subject
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

React Thermals has a simple middleware system that allows modifying state
before the store is updated and before components rerender.

Middleware examples:

```js
// Example: observe the state but do not alter
myStore.use((context, done) => {
  context.prev; // the old state value
  context.next; // the new state value - alter to modify state
  logToServer(context.next);
  done(); // call done to trigger the next middleware
});

// Example: alter the state
myStore.use((context, done) => {
  context.next = doSomeModifications(conext.next);
  done();
});

// Example: call node asynchronously
myStore.use((context, done) => {
  doSomeAsyncModifications(context).then(done);
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

Why did we start at version 4? React Thermals is an evolution of
[react-create-use-store version 3](https://npmjs.com/package/react-create-use-store).
