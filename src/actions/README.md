# Action Creators

Actions that update state values can be generated automatically.

1. [Introduction](#introduction)
2. [Properties and Paths](#properties-and-paths)
3. [Documentation and Examples](#documentation-and-examples)
   1. [adder](#adder--) - Add to or subtract from a number
   2. [appender](#appender--) - Append an item to a list
   3. [cycler](#cycler--) - Cycle through a list of values
   4. [fetcher](#fetcher--) - `fetch()` and store data
   5. [mapper](#mapper--) - Update each value in a list
   6. [merger](#merger--) - Merge one object into another
   7. [remover](#remover--) - Remove an item from a list
   8. [replacer](#replacer--) - Replace an item in a list
   9. [setter](#setter--) - Set a single value
   10. [toggler](#toggler--) - Toggle a boolean value

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
you'd like to use it directly, you can import it:

`import { updatePath } from 'react-thermals';`

Note that if a path contains `@` or `*`, typechecking and intellisense is not available.

## Documentation and Examples

### setter()

Set a single value.

#### Equivalent code

```jsx
const setUser = store.connect('user', setter());
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

stores/postsStore.ts

```jsx
import { Store, setter } from 'react-thermals';

const store = new Store({ page: 1 });
export const setPage = store.connect('page', setter());
```

components/PostsPagination.tsx

```jsx
import { setPage } from '../stores/postsStore';
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

### setterInput()

Set a single value synchronously from an input's onChange event.

#### Equivalent code

```jsx
const setSearchTerm = store.connect('searchTerm', setterInput());
// is equivalent to
const [state, setState] = useState({ searchTerm: '' });
const setSearchTerm = useCallback(
  evt => {
    setState(old => ({
      ...old,
      searchTerm: evt.target.value,
    }));
  },
  [setState]
);
```

#### Examples

stores/postsStore.js

```js
import { createStore, useStoreSelector, setterSync } from 'react-thermals';

const store = new Store({ searchTerm: '' });
export const setSearchInput = store.connect('searchTerm', setterInput());
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
const toggleIsActive = store.connect('isActive', toggler());
// is equivalent to
const [state, setState] = useState({ isActive: false });
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
export const toggleDetails = store.connect('showDetails', toggler());
export function usePostsStore(selector) {
  return useStoreSelector(postsStore, selector);
}
```

components/PostText.jsx

```jsx
import { usePostsStore, toggleDetails } from '../stores/postsStore';

export default function PostText() {
  const showDetails = usePostsStore('showDetails');
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

### appender()

Add an item to an array.

#### Equivalent code

```js
const addTodo = state.connect('todos', appender());
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
export const addTodo = store.connect('todos', appender());
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

### remover()

Remove an item from an array.

#### Equivalent code

```js
const removeTodo = store.connect('todos', remover());
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
export const addTodo = store.connect('todos', appender());
export const removeTodo = store.connect('todos', remover());
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

### replacer()

Replace one item with another.

#### Equivalent code

```js
const replaceTag = store.connect('tags', replacer());
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

```js
const replaceTag = store.connect('total', adder());
// is equivalent to
const [state, setState] = useState({ total: 0 });
const setField = useCallback(
  addend => {
    setState(old => ({
      ...old,
      total: old.total + addend,
    }));
  },
  [setState]
);
```

In stores/gameStore.js

```jsx harmony
import { Store, adder } from 'react-thermals';

const gameStore = new Store({ x: 0, y: 0 });

export const moveUp = store.connect('y', adder(1));
export const moveDown = store.connect('y', adder(-1));
export const moveRight = store.connect('x', adder(1));
export const moveLeft = store.connect('x', adder(-1));

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

export const gameStore = new Store({ x: 0, y: 0 });

export const vertical = store.connect('y', adder());
export const horizontal = store.connect('x', adder());
```

components/GamePad.jsx

```jsx
import { gameStore, vertical, horizontal } from '../stores/gameStore';

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

### merger()

Like setter, but merges the partial state into the full state.

#### Equivalent code

```js
const updateUser = store.connect('user', merger());
// is equivalent to
const [state, setState] = useState({
  user: {
    first: 'Josh',
    last: 'Smith',
  },
});
const updateUser = useCallback(
  partial => {
    setState(old => ({
      ...old,
      user: {
        ...old.user,
        ...partial,
      },
    }));
  },
  [setState]
);
```
