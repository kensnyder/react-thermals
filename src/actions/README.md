# Action Creators

Actions that update state values can be generated automatically.

1. [Introduction](#introduction)
2. [Properties and Paths](#properties-and-paths)
3. [Documentation and Examples](#documentation-and-examples)
   1. [setter](#setter) - Set a single value
   2. [toggler](#toggler) - Toggle a boolean value
   3. [appender](#appender) - Append an item to a list
   4. [remover](#remover) - Remove an item from a list
   5. [replacer](#replacer) - Replace an item in a list
   6. [adder](#adder) - Add to or subtract from a number
   7. [merger](#merger) - Merge one object into another

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

`import { updatePath } from 'react-thermals/actions';`

Read more at the [updatePath docs](../src/updatePath/README.md).

## Documentation and Examples

### setter()

Set a single value.

#### Equivalent code

```jsx
const [state, setState] = useState({});
const setField = useCallback(
  (name, value) => {
    setState(old => ({
      ...old,
      [name]: value,
    }));
  },
  [setState]
);
```

#### Examples

```jsx
// In /stores/postsStore.ts
import { Store } from 'react-thermals';
import { setter } from 'react-thermals/actions';
const postsStore = new Store({
  state: {
    page: 1,
  },
  actions: {
    setPage: setter('page'),
  },
});
export default postsStore;

// In components/PostsPagination.tsx
import postsStore from '../stores/postsStore';
const { setPage } = postsStore.actions;
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

### setterSync

Set a single value synchronously.

stores/postsStore.js

```jsx
import { createStore, useStoreSelector } from 'react-thermals';
import { setterSync } from 'react-thermals/actions';
const postsStore = new Store({
  state: {
    searchTerm: '',
  },
  actions: {
    setSearchTerm: setterSync('searchTerm'),
  },
});
export default postsStore;
```

components/PostsSearch.jsx

```jsx
import postsStore from '../stores/postsStore';
const { setSearchTerm } = postsStore.actions;
export default function PostsSearch() {
  const searchTerm = useStoreSelector(postsStore, state => state.searchTerm);
  return (
    <input
      value={searchTerm}
      onChange={evt => setSearchTerm(evt.target.value)}
    />
  );
}
```

### setterInput

Set a single value synchronously from an input's onChange event.

#### Examples

stores/postsStore.js

```jsx
import { createStore, useStoreSelector } from 'react-thermals';
import { setterSync } from 'react-thermals/actions';

const postsStore = new Store({
  state: {
    searchTerm: '',
  },
  actions: {
    setSearchTerm: setterInput('searchTerm'),
  },
});
export default postsStore;
```

components/PostsSearch.jsx

```jsx
import postsStore from '../stores/postsStore';
const { setSearchTerm } = postsStore.actions;
export default function PostsSearch() {
  const searchTerm = useStoreSelector(postsStore, state => state.searchTerm);
  return <input value={searchTerm} onChange={setSearchTerm} />;
}
```

### toggler

Toggle a boolean value.

#### Equivalent code

```jsx
const [state, setState] = useState({});
const setField = useCallback(
  name => {
    setState(old => (old[name] = !old[name]));
  },
  [setState]
);
```

```jsx harmony
import { Store, useStoreSelector } from 'react-thermals';
import { toggler } from 'react-thermals/actions';

const postsStore = new Store({
  state: { showDetails: false },
  actions: {
    toggleDetails: toggler('showDetails'),
  },
});

export default postsStore;

export function usePostsStore(selector) {
  return useStoreSelector(postsStore, selector);
}
```

components/PostText.jsx

```jsx
import postsStore, { usePostsStore } from '../stores/postsStore';
const { toggleDetails } = postsStore.actions;

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

### togglerSync

Equivalent to toggler but synchronous.

### appender

Add an item to an array.

#### Equivalent code

```jsx
const [state, setState] = useState({});
const setField = useCallback(
  (name, newItem) => {
    setState(old => (old[name] = [...old[name], newItem]));
  },
  [setState]
);
```

#### Examples

stores/todoStore.js

```js
import { Store, useStoreSelector } from 'react-thermals';
import { appender } from 'react-thermals/actions';

const todoStore = new Store({
  state: { todos: [] },
  actions: {
    addTodo: appender('todos'),
  },
});

export default todoStore;

export function useTodos() {
  return useStoreSelector(todoStore, 'todos');
}
```

components/TodoList.jsx

```jsx
import { useRef, useCallback } from 'react';
import todoStore from '../stores/todoStore';
const { addTodo } = todoStore.actions;

export default function TodoList() {
  const inputRef = useRef();
  const todos = useTodos();
  const addItem = useCallback(() => {
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
      <button onClick={addTodo}>Add</button>
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

### appenderSync

Equivalent to appender but synchronous.

### remover

Remove an item from an array.

#### Equivalent code

```jsx
const [state, setState] = useState({});
const setField = useCallback(
  (name, itemToRemove) => {
    setState(old => {
      return old[name].filter(item => {
        return item !== itemToRemove;
      });
    });
  },
  [setState]
);
```

#### Examples

stores/todoStore.js

```js
import { Store, useStoreSelector } from 'react-thermals';
import { appender } from 'react-thermals/actions';

const todoStore = new Store({
  state: { todos: [] },
  actions: {
    addTodo: appender('todos'),
    deleteTodo: remover('todos'),
  },
});

export default todoStore;

export function useTodos() {
  return useStoreSelector(todoStore, 'todos');
}
```

components/TodoList.jsx

```jsx
import { useRef, useCallback } from 'react';
import todoStore from '../stores/todoStore';
const { addTodo, deleteTodo } = todoStore.actions;

export default function TodoList() {
  const inputRef = useRef();
  const todos = useTodos();
  const addItem = useCallback(() => {
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
      <button onClick={addTodo}>Add</button>
      <ul>
        {todos.map(todo => (
          <li>
            {todo.done ? '[x]' : '[ ]'} {todo.text}
            <span onClick={() => deleteTodo(todo)}>[Delete]</span>
          </li>
        ))}
      </ul>
    </>
  );
}
```

### removerSync

Equivalent to remover but synchronous.

### replacer

### replacerSync

Equivalent to replacer but synchronous.

### adder

Add or subtract from a given field.

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
import { Store } from 'react-thermals';
import { adder } from 'react-thermals/actions';

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
import gameStore from '../stores/gameStore';
const { moveUp, moveDown, moveRight, moveLeft } = gameStore.actions;

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
import { Store } from 'react-thermals';
import { adder } from 'react-thermals/actions';

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
import gameStore from '../stores/gameStore';
const { moveUp, moveDown, moveRight, moveLeft } = gameStore.actions;

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

### adderSync

Equivalent to adder but synchronous.

### merger

### mergerSync

Equivalent to merger but synchronous.
