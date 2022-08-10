import React, { useState } from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import useStoreState from '../useStoreState/useStoreState.js';
import { fieldSetter } from '../../actions/fieldSetter.js';
import { fieldListSetter } from '../../actions/fieldListSetter.js';
import createStore from './createStore.js';

describe('createStore()', () => {
  it('should have required properties', () => {
    const store = createStore({});
    expect(typeof store.reset).toBe('function');
    expect(typeof store.actions).toBe('object');
    expect(typeof store.getState).toBe('function');
  });
  it('should make setters from actions', async () => {
    const store = createStore({
      state: { age: 14 },
      actions: {
        setAge: fieldSetter('age'),
        setName: fieldListSetter('@', ['fname', 'lname']),
      },
    });
    const { setAge, setName } = store.actions;
    expect(typeof setAge).toBe('function');
    expect(typeof setName).toBe('function');
    setAge(15);
    const awaited = await store.nextState();
    expect(awaited).toEqual({ age: 15 });
    expect(store.getState()).toEqual({ age: 15 });
    setName('John', 'Doe');
    await store.nextState();
    expect(store.getState()).toEqual({
      age: 15,
      fname: 'John',
      lname: 'Doe',
    });
  });
  it('should reset state', async () => {
    const store = createStore({
      state: { age: 10 },
      actions: {
        setAge: fieldSetter('age'),
      },
    });
    const { setAge } = store.actions;
    setAge(11);
    await store.nextState();
    store.reset();
    await store.nextState();
    expect(store.getState()).toEqual({ age: 10 });
  });
  it('should setState with Promise', async () => {
    const state = 42;
    const store = createStore({ state });
    expect(store.getState()).toBe(state);
    store.setState(old => Promise.resolve(old + 1));
    await store.nextState();
    expect(store.getState()).toBe(43);
  });
  it('should mergeState with Promise', async () => {
    const state = { count: 42, view: 'list' };
    const store = createStore({ state });
    expect(store.getState()).toBe(state);
    store.mergeState(old => Promise.resolve({ count: old.count + 1 }));
    await store.nextState();
    expect(store.getState()).toEqual({ count: 43, view: 'list' });
  });
  it('should setSync', () => {
    const state = { count: 5 };
    const store = createStore({ state });
    expect(store.getState()).toBe(state);
    store.setSync({ count: 6 });
    expect(store.getState()).toEqual({ count: 6 });
  });
  it('should setSync with function', () => {
    const state = 42;
    const store = createStore({ state });
    expect(store.getState()).toBe(state);
    store.setSync(old => old + 1);
    expect(store.getState()).toBe(43);
  });
  it('should mergeSync', () => {
    const state = { count: 5, mode: 'up' };
    const store = createStore({ state });
    expect(store.getState()).toBe(state);
    store.mergeSync({ count: 6 });
    expect(store.getState()).toEqual({ count: 6, mode: 'up' });
  });
  it('should setSync with function', () => {
    const state = { count: 5, mode: 'up' };
    const store = createStore({ state });
    expect(store.getState()).toBe(state);
    store.mergeSync(old => ({ count: old.count + 1 }));
    expect(store.getState()).toEqual({ count: 6, mode: 'up' });
  });
  it('should get and set options', () => {
    const options = { debug: false };
    const store = createStore({ options });
    expect(store.getOptions()).toEqual({ debug: false });
    expect(store.setOptions({ debug: true })).toBe(store);
    expect(store.getOptions()).toEqual({ debug: true });
    store.setOptions({ another: 1 });
    expect(store.getOptions()).toEqual({ debug: true, another: 1 });
  });
  it('should allow plugins', async () => {
    let pluggedInto;
    const store = createStore({});
    store.plugin(s => (pluggedInto = s));
    expect(pluggedInto).toBe(store);
  });
  it('should allow blocking plugins', async () => {
    let pluggedInto;
    const store = createStore({});
    store.on('BeforePlugin', evt => evt.preventDefault());
    store.plugin(s => (pluggedInto = s));
    expect(pluggedInto).toBe(undefined);
  });
});

describe('createStore() with autoReset', () => {
  // define store before each test
  let store;
  let ListComponent;
  let PageComponent;
  beforeEach(() => {
    const state = { page: 1, sort: '-date' };
    const actions = {
      setPage: fieldSetter('page'),
      setSort: fieldSetter('sort'),
      thrower() {
        store.setState(old => {
          throw new Error('my error');
        });
      },
      syncThrower() {
        store.setState(old => {
          throw new Error('my sync error');
        });
        store.flushSync();
      },
    };
    store = createStore({
      state,
      actions,
      autoReset: true,
    });
    ListComponent = () => {
      const state = useStoreState(store);
      const { setPage, thrower, syncThrower } = store.actions;
      return (
        <div className="List">
          <span>page={state.page}</span>
          <button onClick={() => setPage(old => old + 1)}>Next</button>
          <button onClick={thrower}>Throw</button>
          <button onClick={syncThrower}>syncThrow</button>
        </div>
      );
    };
    PageComponent = () => {
      const [show, setShow] = useState(true);
      return (
        <div className="MaybeSearchComponent">
          <button onClick={() => setShow(true)}>Show</button>
          <button onClick={() => setShow(false)}>Hide</button>
          {show && <ListComponent />}
        </div>
      );
    };
  });
  it('should auto reset', async () => {
    const { getByText } = render(<PageComponent />);
    expect(store.getState().page).toBe(1);
    await act(() => {
      fireEvent.click(getByText('Next'));
    });
    expect(store.getState().page).toBe(2);
    await act(() => {
      fireEvent.click(getByText('Hide'));
    });
    await act(() => {
      fireEvent.click(getByText('Show'));
    });
    expect(store.getState().page).toBe(1);
  });
  it('should fire BeforeReset and AfterReset', async () => {
    let before = false;
    let after = false;
    store.on('BeforeReset', () => (before = true));
    store.on('AfterReset', () => (after = true));
    const { getByText } = render(<PageComponent />);
    expect(before).toBe(false);
    expect(after).toBe(false);
    await act(() => {
      fireEvent.click(getByText('Next'));
    });
    await act(() => {
      fireEvent.click(getByText('Hide'));
    });
    expect(before).toBe(true);
    expect(after).toBe(true);
  });
  it('should allow preventing reset', async () => {
    let before = false;
    let after = false;
    store.on('BeforeReset', evt => {
      before = true;
      evt.preventDefault();
    });
    store.on('AfterReset', () => (after = true));
    const { getByText } = render(<PageComponent />);
    expect(before).toBe(false);
    expect(after).toBe(false);
    await act(() => {
      fireEvent.click(getByText('Next'));
    });
    await act(() => {
      fireEvent.click(getByText('Hide'));
    });
    expect(before).toBe(true);
    expect(after).toBe(false);
  });
  it('should fire SetterException', async () => {
    let error;
    store.on('SetterException', evt => (error = evt.data));
    const { getByText } = render(<ListComponent />);
    await act(() => {
      fireEvent.click(getByText('Throw'));
    });
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('my error');
  });
  it('should fire SetterException on flushSync', async () => {
    let error;
    store.on('SetterException', evt => (error = evt.data));
    const { getByText } = render(<ListComponent />);
    await act(() => {
      fireEvent.click(getByText('syncThrow'));
    });
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('my sync error');
  });
});

describe('createStore() flushSync', () => {
  // define store before each test
  let store;
  beforeEach(() => {
    const state = { page: 1, sort: '-date' };
    const actions = {
      setPage: fieldSetter('page'),
      pwn: () => store.setState({ pwned: 42 }),
      promise: () => {
        store.setState(() => {
          return new Promise(resolve => {
            setTimeout(() => resolve({ page: 17, sort: 'date' }), 15);
          });
        });
      },
      promiseError: () => {
        store.setState(() => {
          return new Promise(resolve => {
            throw new Error('Scooby Doo');
          });
        });
      },
      setSyncError: () => {
        store.setSync(() => Promise.resolve(42));
      },
      mergeSyncError: () => {
        store.mergeSync(() => Promise.resolve(42));
      },
    };
    store = createStore({
      state,
      actions,
    });
  });
  it('should flushSync with values', () => {
    store.actions.setPage(2);
    expect(store.getState().page).toBe(1);
    store.flushSync();
    expect(store.getState().page).toBe(2);
  });
  it('should flushSync with state replacement', () => {
    store.actions.pwn();
    expect(store.getState().page).toBe(1);
    store.flushSync();
    expect(store.getState()).toEqual({ pwned: 42 });
  });
  it('should flushSync with values and functions', () => {
    store.actions.setPage(2);
    store.actions.setPage(old => old + 2);
    expect(store.getState().page).toBe(1);
    store.flushSync();
    expect(store.getState().page).toBe(4);
  });
  it('should flushSync with 1 function', () => {
    store.actions.setPage(old => old + 1);
    expect(store.getState().page).toBe(1);
    store.flushSync();
    expect(store.getState().page).toBe(2);
  });
  it('should flushSync with 2 functions', () => {
    store.actions.setPage(old => old + 1);
    store.actions.setPage(old => old + 1);
    expect(store.getState().page).toBe(1);
    store.flushSync();
    expect(store.getState().page).toBe(3);
  });
  it('should handle promise in flushSync', async () => {
    store.actions.promise();
    expect(store.getState().page).toBe(1);
    store.flushSync();
    expect(store.getState().page).toBe(1);
    await new Promise(r => setTimeout(r, 30));
    expect(store.getState().page).toBe(17);
  });
  it('should handle promise error in flushSync', async () => {
    let sawError;
    store.on('SetterException', err => (sawError = err.data));
    store.actions.promiseError();
    store.flushSync();
    expect(store.getState().page).toBe(1);
    await new Promise(r => setTimeout(r, 30));
    expect(sawError).toBeInstanceOf(Error);
    expect(store.getState().page).toBe(1);
  });
  it('should handle BeforeSet with preventDefault in flushSync', () => {
    store.on('BeforeSet', evt => {
      evt.preventDefault();
    });
    store.actions.setPage(old => old + 1);
    expect(store.getState().page).toBe(1);
    store.flushSync();
    expect(store.getState().page).toBe(1);
  });
  it('should handle BeforeUpdate with preventDefault in flushSync', () => {
    store.on('BeforeUpdate', evt => {
      evt.preventDefault();
    });
    store.actions.setPage(old => old + 1);
    expect(store.getState().page).toBe(1);
    store.flushSync();
    expect(store.getState().page).toBe(1);
  });
  it('should error if setSync function returns Promise', () => {
    const thrower = () => {
      store.actions.setSyncError();
    };
    expect(thrower).toThrowError();
    expect(store.getState().page).toBe(1);
  });
  it('should error if mergeSync function returns Promise', () => {
    const thrower = () => {
      store.actions.mergeSyncError();
    };
    expect(thrower).toThrowError();
    expect(store.getState().page).toBe(1);
  });
});
describe('createStore() cloning', () => {
  // define store before each test
  let store;
  beforeEach(() => {
    const state = { page: 1, sort: '-date' };
    const actions = {
      setPage: fieldSetter('page'),
      setSort: fieldSetter('sort'),
    };
    store = createStore({
      state,
      actions,
      autoReset: true,
      id: 'foo',
    });
    store.plugin(function plugin1() {});
    store.plugin(function plugin2() {});
  });
  it('should clone with overrides', () => {
    const cloned = store.clone({ id: 'foo2' });
    expect(Object.keys(cloned.actions)).toEqual(['setPage', 'setSort']);
    expect(cloned.id).toBe('foo2');
    expect(cloned.getPlugins().map(p => p.name)).toEqual([
      'plugin1',
      'plugin2',
    ]);
    expect(cloned.getState()).not.toBe(store.getState());
    expect(cloned.getState()).toEqual(store.getState());
  });
  it('should clone with no overrides', () => {
    const cloned = store.clone();
    expect(Object.keys(cloned.actions)).toEqual(['setPage', 'setSort']);
    expect(cloned.id).toBe('foo');
    expect(cloned.getPlugins().map(p => p.name)).toEqual([
      'plugin1',
      'plugin2',
    ]);
    expect(cloned.getState()).not.toBe(store.getState());
    expect(cloned.getState()).toEqual(store.getState());
  });
});
