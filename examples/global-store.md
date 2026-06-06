# Example: A store with global state

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
globalStore.initState(old => ({ ...old, todos: [] }));

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

// initState updates state but avoids rerendering
globalStore.initState(old => ({
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
