# Action Creators

Actions that update state values can be generated automatically.

1. [Introduction](#introduction)
2. [Properties and Paths](#properties-and-paths)
3. [Documentation and Examples](#documentation-and-examples)
   1. [setter](#setter--) - Set a single value
   2. [toggler](#toggler--) - Toggle a boolean value
   3. [appender](#appender--) - Append an item to a list
   4. [remover](#remover--) - Remove an item from a list
   5. [replacer](#replacer--) - Replace an item in a list
   6. [adder](#adder--) - Add to or subtract from a number
   7. [merger](#merger--) - Merge one object into another

## Introduction

By default, all action creators operate asynchronously, which allows changes to
be batched. But all action creators have a "Sync" equivalent which synchronously
updates state. That may be desirable in situation such as controlled form input
values.

## Properties and Paths

Each of the action creators can operate on a single property, a path to a
property, or a path that matches multiple properties.

Some examples of valid paths:

- `user` - The value of user property
- `user.name` - The name property on the user object
- `users[2].id` - The id of the 3rd user object
- `users.2.id` - (same as above)
- `users[*].isActive` - The isActive property of every user object
- `users.*.isActive` - (same as above)
- `books[*].authors[*].name` - The name of property of every author object
  within every book object
- `@` - The entire state value
- `@*` - Each item in the array (e.g. when the entire state is an Array)
- `@*.id` - The id of each item in the array (e.g. when the entire state is an
  Array of objects with property id)

Note that if the given path does not exist on the state, it will be created.

For example, if the state is `{}` and you set `colors.primary` to `#f00` you
will end up with a state value of `{ colors: { primary: '#f00' } }`.

The function that creates state update functions is called `updatePath`. If
you'd like to use it directly, you can import it from `react-thermals/actions`:

`import updatePath from 'react-thermals';`

Read more at the [updatePath docs](../src/updatePath/README.md).

## Documentation and Examples

### setter()

Set a single value.

#### Equivalent code

```jsx
const setUser = store.connect(setter('user'));
// is equivalent to
const [state, setState] = useState({});
const setUser = useCallback(
  user => {
    setState(old => ({
      ...old,
      user,
    }));
  },
  [setState]
);
```

#### Examples

```jsx
// In /stores/postsStore.ts
import { Store, setter } from 'react-thermals';

const store = new Store({ page: 1 });
export const setPage = store.connect(setter('page'));

// In components/PostsPagination.tsx
import store, { setPage } from '../stores/postsStore';
export default function Pagination() {
  return (
    <>
      <button onClick={() => setPage(1)}>First Page</button>
      <button onClick={() => setPage(old => old.page - 1)}>Prev Page</button>
      <button onClick={() => setPage(old => old.page + 1)}>Next Page</button>
    </>
  );
}
```

### setterSync()

Set a single value synchronously.

#### Examples

stores/postsStore.js

```js
import { createStore, useStoreSelector, setterSync } from 'react-thermals';

const store = new Store({ searchTerm: '' });
export const setSearchTermSync = store.connect(setterSync('searchTerm'));
export function useSearchTerm() {
  return useStoreSelector(store, state => state.searchTerm);
}
```

components/PostsSearch.jsx

```jsx
import { setSearchTermSync, useSearchTerm } from '../stores/postsStore';
export default function PostsSearch() {
  const searchTerm = useSearchTerm();
  return (
    <input
      value={searchTerm}
      onChange={evt => setSearchTermSync(evt.target.value)}
    />
  );
}
```

### setterInput()

Set a single value synchronously from an input's onChange event.

#### Examples

stores/postsStore.js

```js
import { createStore, useStoreSelector, setterSync } from 'react-thermals';

const store = new Store({ searchTerm: '' });
export const setSearchInput = store.connect(setterInput('searchTerm'));
export function useSearchTerm() {
  return useStoreSelector(store, state => state.searchTerm);
}
```

components/PostsSearch.jsx

```jsx
import { setSearchInput, useSearchTerm } from '../stores/postsStore';
export default function PostsSearch() {
  const searchTerm = useSearchTerm();
  return <input value={searchTerm} onChange={setSearchInput} />;
}
```

### toggler()

Toggle a boolean value.

#### Equivalent code

```js
const toggleIsActive = store.connect(toggler('isActive'));
// is equivalent to
const [state, setState] = useState({});
const toggleIsActive = useCallback(
  () =>
    setState(old => ({
      ...old,
      isActive: !old.isActive,
    })),
  [setState]
);
```

#### Example

stores/postStore.js

```jsx harmony
import { useStoreSelector, toggler } from 'react-thermals';

const store = new Store({ showDetails: false });
export const toggleDetails = store.connect(toggler('showDetails'));
export function usePostsStore(selector) {
  return useStoreSelector(postsStore, selector);
}
```

components/PostText.jsx

```jsx
import { usePostsStore, toggleDetails } from '../stores/postsStore';

export default function PostText() {
  const showDetails = usePostsStore(state => state.showDetails);
  return (
    <>
      <p>Summary text</p>
      {showDetails && <p>Details text</p>}
      <button onClick={toggleDetails}>
        {showDetails ? 'Hide' : 'Show'} details
      </button>
    </>
  );
}
```

### togglerSync()

Equivalent to toggler but synchronous.

### appender()

Add an item to an array.

#### Equivalent code

```js
const addTodo = state.connect(appender('todos'));
// is equivalent to
const [state, setState] = useState({ todos: [] });
const addTodo = useCallback(
  newTodo => {
    setState(old => ({ ...old, todos: [...old.todos, newTodo] }));
  },
  [setState]
);
```

#### Examples

stores/todoStore.js

```js
import { Store, useStoreSelector, appender } from 'react-thermals';

const store = new Store({ todos: [] });
export const addTodo = store.connect(appender('todos'));
export function useTodos() {
  return useStoreSelector(todoStore, 'todos');
}
```

components/TodoList.jsx

```jsx
import { useRef, useCallback } from 'react';
import { useTodos, addTodo } from '../stores/todoStore';

export default function TodoList() {
  const inputRef = useRef();
  const todos = useTodos();
  const createFromInput = useCallback(() => {
    addTodo({
      text: inputRef.current.value,
      done: false,
    });
    inputRef.current.value = '';
    inputRef.current.focus();
  }, [inputRef]);
  return (
    <>
      <input ref={inputRef} placeholder="Enter task..." />
      <button onClick={createFromInput}>Add</button>
      <ul>
        {todos.map(todo => (
          <li>
            {todo.done ? '[x]' : '[ ]'} {todo.text}
          </li>
        ))}
      </ul>
    </>
  );
}
```

### appenderSync()

Equivalent to appender but synchronous.

### remover()

Remove an item from an array.

#### Equivalent code

```js
const removeTodo = store.connect(remover('todos'));
// is equiavlent to
const [state, setState] = useState({ todos: [] });
const setField = useCallback(
  itemToRemove => {
    setState(old => ({
      ...old,
      todos: old.todos.filter(item => {
        return item !== itemToRemove;
      }),
    }));
  },
  [setState]
);
```

#### Examples

stores/todoStore.js

```js
import { Store, useStoreSelector, appender, remover } from 'react-thermals';

const store = new Store({ todos: [] });
export const addTodo = store.connect(appender('todos'));
export const removeTodo = store.connect(remover('todos'));
export function useTodos() {
  return useStoreSelector(todoStore, 'todos');
}
```

components/TodoList.jsx

```jsx
import { useRef, useCallback } from 'react';
import { useTodos, addTodo, removeTodo } from '../stores/todoStore';

export default function TodoList() {
  const inputRef = useRef();
  const todos = useTodos();
  const createFromInput = useCallback(() => {
    addTodo({
      text: inputRef.current.value,
      done: false,
    });
    inputRef.current.value = '';
    inputRef.current.focus();
  }, [inputRef]);
  return (
    <>
      <input ref={inputRef} placeholder="Enter task..." />
      <button onClick={createFromInput}>Add</button>
      <ul>
        {todos.map(todo => (
          <li>
            {todo.done ? '[x]' : '[ ]'}
            {todo.text}
            <span onClick={() => removeTodo(todo)}>Delete</span>
          </li>
        ))}
      </ul>
    </>
  );
}
```

### removerSync()

Equivalent to remover but synchronous.

### replacer()

Replace one item with another.

#### Equivalent code

```js
const replaceTag = store.connect(replacer('tags'));
// is equivalent to
const [state, setState] = useState({
  tags: [{ id: 12, name: 'Apple' }],
});
const renameTag = useCallback(
  (tag, newTag) => {
    setState(old => ({
      ...old,
      tags: old.tags.map(oldTag => (oldTag === tag ? newTag : oldTag)),
    }));
  },
  [setState]
);
```

### replacerSync()

Equivalent to replacer but synchronous.

### adder()

Add or subtract from a given number.

#### Equivalent code

```jsx
const [state, setState] = useState({});
const setField = useCallback(
  (name, addend) => {
    setState(old => (old[name] = old[name] + addend));
  },
  [setState]
);
```

In stores/gameStore.js

```jsx harmony
import { Store, adder } from 'react-thermals';

const gameStore = new Store({
  state: { x: 0, y: 0 },
  actions: {
    moveUp: adder('y', 1),
    moveDown: adder('y', -1),
    moveRight: adder('x', 1),
    moveLeft: adder('x', -1),
  },
});

export default gameStore;
```

components/GamePad.jsx

```jsx
import gameStore, {
  moveUp,
  moveDown,
  moveRight,
  moveLeft,
} from '../stores/gameStore';

export default function GamePad() {
  return (
    <>
      <button onClick={moveUp}>⬆︎</button>
      <button onClick={moveDown}>⬇︎︎</button>
      <button onClick={moveRight}>➡︎</button>
      <button onClick={moveLeft}>⬅︎</button>
    </>
  );
}
```

Or allow pass the addend later.

stores/gameStore.js

```jsx harmony
import { Store, adder } from 'react-thermals';

const gameStore = new Store({
  state: { x: 0, y: 0 },
  actions: {
    vertical: adder('y'),
    horizontal: adder('x'),
  },
});

export default gameStore;
```

components/GamePad.jsx

```jsx
import gameStore, { vertical, horizontal } from '../stores/gameStore';

export default function GamePad() {
  return (
    <>
      <button onClick={() => vertical(-1)}>⬆︎</button>
      <button onClick={() => vertical(1)}>⬇︎︎</button>
      <button onClick={() => horizontal(1)}>➡︎</button>
      <button onClick={() => horizontal(-1)}>⬅︎</button>
    </>
  );
}
```

### adderSync()

Equivalent to adder but synchronous.

### merger()

### mergerSync()

Equivalent to merger but synchronous.
