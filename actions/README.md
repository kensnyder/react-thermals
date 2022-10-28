## Action Creators

Actions that get, set, and append state values can be generated automatically.

1. [fieldSetter](#fieldsetter)
2. [fieldListSetter](#fieldlistsetter)
3. [fieldToggler](#fieldtoggler)
4. [fieldAdder](#fieldadder)
5. [fieldAppender](#fieldappender)
6. [fieldRemover](#fieldremover)

### fieldSetter

Set a single field.

```tsx
// In /stores/postsStore.ts
import { Store } from 'react-thermals';
import { fieldSetter } from 'react-thermals/actions';
const postsStore = new Store({
  state: {
    page: 1,
  },
  actions: {
    setPage: fieldSetter('page'),
  },
});
export default postsStore;

// In components/PostsPagination.tsx
import postsStore from '../stores/postsStore';
const { setPage } = store.actions;
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

### fieldSetterSync

Set a single field synchronously.

```jsx harmony
import { createStore, useStoreSelector } from 'react-thermals';
import { fieldSetterSync } from 'react-thermals/actions';
const postsStore = new Store({
  state: {
    search: '',
  },
  actions: {
    setSearch: fieldSetterSync('search'),
  },
});
export default postsStore;

// Then in PostsSearch.jsx
import postsStore from '../stores/postsStore';
const { setSearch } = postsStore.actions;
export default function PostsSearch() {
    const search = useStoreSelector(postsStore, 'search');
    return (
        <input value={search} onChange={evt => setSearch(evt.target.value)} />
    );
}
```

### fieldSetterInput

Set a single field synchronously from an input's onChange event.

```jsx harmony
import { createStore, useStoreSelector } from 'react-thermals';
import { fieldSetterInput } from 'react-thermals/actions';

const store = new Store({
  state: {
    search: '',
  },
  actions: {
    setSearch: fieldSetterInput('search'),
  },
});
// Then in Component.jsx
const { setSearch } = store.setSearch;
const search = useStoreSelector(store, 'search');
<input value={search} onChange={fieldSetterInput} />;
```

### fieldListSetter & fieldListSetterSync

Set a list of fields.

```jsx harmony
import { Store } from 'react-thermals';
import { fieldListSetter } from 'react-thermals/actions';

const store = new Store({
  state: { fname: '', lname: '' },
  actions: {
    setName: fieldListSetter(['fname', 'lname']),
  },
});
// Then in Component:
const { setName } = store.actions;
<button onClick={() => setName('George', 'Jetson')}>
  Change name to George Jetson
</button>;
```

### fieldToggler & fieldTogglerSync

Set a list of fields.

```jsx harmony
import { Store } from 'react-thermals';
import { fieldToggler } from 'react-thermals/actions';

const store = new Store({
  state: { showStats: false },
  actions: {
    toggleStats: fieldToggler('showStats'),
  },
});
// Then in Component:
const { toggleStats } = store.actions;
<button onClick={toggleStats}>Show/Hide stats</button>;
```

### fieldAdder & fieldAdderSync

Add or subtract from a given field.

```jsx harmony
import { Store } from 'react-thermals';
import { fieldAdder } from 'react-thermals/actions';

const store = new Store({
  state: { x: 0, y: 0 },
  actions: {
    moveUp: fieldAdder('y', 1),
    moveDown: fieldAdder('y', -1),
    moveRight: fieldAdder('x', 1),
    moveLeft: fieldAdder('x', -1),
  },
});
// Then in Component:
const { moveUp, moveDown, moveRight, moveLeft } = store.actions;
<button onClick={moveUp}>⬆︎</button>;
<button onClick={moveDown}>⬇︎︎</button>;
<button onClick={moveRight}>➡︎</button>;
<button onClick={moveLeft}>⬅︎</button>;
```

Or allow handler to add or subtract from a given field.

```jsx harmony
import { Store } from 'react-thermals';
import { fieldAdder } from 'react-thermals/actions';

const store = new Store({
  state: { x: 0, y: 0 },
  actions: {
    vertical: fieldAdder('y'),
    horizontal: fieldAdder('x'),
  },
});
// Then in Component:
const { moveUp, moveDown, moveRight, moveLeft } = store.actions;
<button onClick={() => vertical(-1)}>⬆︎</button>;
<button onClick={() => vertical(1)}>⬇︎︎</button>;
<button onClick={() => horizontal(1)}>➡︎</button>;
<button onClick={() => horizontal(-1)}>⬅︎</button>;
```

### fieldAppender & fieldAppenderSync

Add an item to an array.

```jsx harmony
import { Store } from 'react-thermals';
import { fieldAppender } from 'react-thermals/actions';

const store = new Store({
  state: { todos: [] },
  actions: {
    addTodo: fieldAppender('todos'),
  },
});
// Then in Component:
const { addTodo } = store.actions;
<button onClick={() => addTodo({ text: 'Wash the Car', done: false })}>
  Wash the Car
</button>;
```

### fieldRemover & fieldRemoverSync

Remove an item from an array.

```jsx harmony
import { Store } from 'react-thermals';
import { fieldRemover } from 'react-thermals/actions';

const store = new Store({
  state: { todos: ['Eat more pie'] },
  actions: {
    deleteTodo: fieldRemover('todos'),
  },
});
// Then in Component:
const { deleteTodo } = store.actions;
<button onClick={() => deleteTodo('Eat more pie')}>
  Delete "Eat more pie"
</button>;
```
