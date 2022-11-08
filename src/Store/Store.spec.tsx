import React, { FunctionComponent, MouseEventHandler, useState } from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { vitest } from 'vitest';
import '@testing-library/jest-dom';
import useStoreState from '../useStoreState/useStoreState';
import { setter } from '../actions/setter';
import Store from './Store';
import PreventableEvent from '../PreventableEvent/PreventableEvent';
import MiddlewareContextInterface from './MiddlewareContext.interface';

describe('new Store()', () => {
  it('should have required properties', () => {
    const store = new Store();
    expect(typeof store.reset).toBe('function');
    expect(typeof store.actions).toBe('object');
    expect(typeof store.getState).toBe('function');
  });
  it('should make setters from actions', async () => {
    const store = new Store({
      state: { age: 14 },
      actions: {
        setAge: setter('age'),
        setName: setter('name'),
      },
    });
    const { setAge, setName } = store.actions;
    expect(typeof setAge).toBe('function');
    expect(typeof setName).toBe('function');
    setAge(15);
    const awaited = await store.nextState();
    expect(awaited).toEqual({ age: 15 });
    expect(store.getState()).toEqual({ age: 15 });
    setName('John Doe');
    await store.nextState();
    expect(store.getState()).toEqual({
      age: 15,
      name: 'John Doe',
    });
  });
  it('should reset state', async () => {
    const store = new Store({
      state: { age: 10 },
      actions: {
        setAge: setter('age'),
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
    const store = new Store({ state });
    expect(store.getState()).toBe(state);
    store.setState((old: number) => Promise.resolve(old + 1));
    const newState = await store.nextState();
    expect(newState).toBe(43);
  });
  it('should mergeState with Promise', async () => {
    type TestState = {
      count: number;
      view: string;
    };
    const state = { count: 42, view: 'list' };
    const store = new Store({ state });
    expect(store.getState()).toBe(state);
    store.mergeState((old: TestState) =>
      Promise.resolve({ count: old.count + 1 })
    );
    await store.nextState();
    expect(store.getState()).toEqual({ count: 43, view: 'list' });
  });
  it('should setSync', () => {
    const state = { count: 5 };
    const store = new Store({ state });
    expect(store.getState()).toBe(state);
    store.setSync({ count: 6 });
    expect(store.getState()).toEqual({ count: 6 });
  });
  it('should setSync with function', () => {
    const state = 42;
    const store = new Store({ state });
    expect(store.getState()).toBe(state);
    store.setSync((old: number) => old + 1);
    expect(store.getState()).toBe(43);
  });
  it('should mergeSync', () => {
    const state = { count: 5, mode: 'up' };
    const store = new Store({ state });
    expect(store.getState()).toBe(state);
    store.mergeSync({ count: 6 });
    expect(store.getState()).toEqual({ count: 6, mode: 'up' });
  });
  it('should setSync with function', () => {
    type TestState = {
      count: number;
      mode: string;
    };
    const state = { count: 5, mode: 'up' };
    const store = new Store({ state });
    expect(store.getState()).toBe(state);
    store.mergeSync((old: TestState) => ({ count: old.count + 1 }));
    expect(store.getState()).toEqual({ count: 6, mode: 'up' });
  });
  it('should get and set options', () => {
    const options = { debug: false };
    const store = new Store({ options });
    expect(store.getOptions()).toEqual({ debug: false });
    expect(store.setOptions({ debug: true })).toBe(store);
    expect(store.getOptions()).toEqual({ debug: true });
    store.setOption('another', 1);
    expect(store.getOptions()).toEqual({ debug: true, another: 1 });
    expect(store.getOption('debug')).toEqual(true);
    expect(store.getOption('another')).toEqual(1);
  });
  it('should extend options', () => {
    const options = { debug: false };
    const store = new Store({ options });
    expect(store.getOptions()).toEqual({ debug: false });
    expect(store.extendOptions({ debug: true, foo: 'bar' })).toBe(store);
    expect(store.getOptions()).toEqual({ debug: true, foo: 'bar' });
    store.setOption('another', 1);
  });
  it('should allow plugins', () => {
    const spy: Function = vitest.fn();
    const store = new Store();
    store.plugin(spy);
    expect(spy).toHaveBeenCalledWith(store);
  });
  it('should allow blocking plugins', () => {
    const spy: Function = vitest.fn();
    const store = new Store();
    store.on('BeforePlugin', (evt: PreventableEvent) => evt.preventDefault());
    store.plugin(spy);
    expect(spy).not.toHaveBeenCalled();
  });
  it('should throw on missing plugins', () => {
    const store = new Store();
    const throwers = [
      store.subscribe,
      store.undo,
      store.redo,
      store.jump,
      store.jumpTo,
      store.getHistory,
    ];
    for (const thrower of throwers) {
      expect(thrower).toThrow();
    }
  });
  it('should setSyncAt(path, value)', async () => {
    const store = new Store({
      state: { hello: { world: 42 } },
    });
    store.setSyncAt('hello.world', 44);
    expect(store.getState().hello.world).toBe(44);
  });
  it('should setSyncAt(path, transformer)', async () => {
    const store = new Store({
      state: { hello: { world: 42 } },
    });
    store.setSyncAt('hello.world', (s: number) => s + 1);
    expect(store.getState().hello.world).toBe(43);
  });
  it('should setStateAt(path, value)', async () => {
    const store = new Store({
      state: { hello: { world: 42 } },
    });
    store.setStateAt('hello.world', 44);
    store.flushSync();
    expect(store.getState().hello.world).toBe(44);
  });
  it('should setStateAt(path, transformer)', async () => {
    const store = new Store({
      state: { hello: { world: 42 } },
    });
    store.setStateAt('hello.world', (s: number) => s + 1);
    store.flushSync();
    expect(store.getState().hello.world).toBe(43);
  });
  it('should getStateAt(path)', async () => {
    const store = new Store({
      state: { hello: { world: 42 } },
    });
    expect(store.getStateAt('hello.world')).toBe(42);
  });
  it('should getStateAt(path) with asterisk', async () => {
    const store = new Store({
      state: {
        books: [
          {
            title: 'JavaScript ABCs',
            authors: [
              { name: 'John A', rating: 2 },
              { name: 'Kyle B', rating: 4 },
            ],
          },
          {
            title: 'Web Tech Rocks',
            authors: [{ name: 'Owen C', rating: 5 }],
          },
        ],
      },
    });
    expect(store.getStateAt('books.*.authors.*.rating')).toEqual([2, 4, 5]);
  });
  it('should extendState(moreState)', async () => {
    const initialState = { hello: { world: 42 } };
    const store = new Store({ state: initialState });
    const ret = store.extendState({ foo: 'bar' });
    expect(store.getState()).toBe(initialState);
    expect(store.getState().foo).toBe('bar');
    expect(ret).toBe(store);
  });
  it('should throw if extendState(moreState) moreState not an object', async () => {
    const initialState = { hello: { world: 42 } };
    const store = new Store({ state: initialState });
    const thrower = () => {
      store.extendState(42);
    };
    expect(thrower).toThrow();
  });
});
describe('new Store() with autoReset', () => {
  // define store before each test
  let store: Store;
  let ListComponent: FunctionComponent;
  let PageComponent: FunctionComponent;
  type TestState = {
    page: number;
    sort: string;
  };
  beforeEach(() => {
    const state: TestState = { page: 1, sort: '-date' };
    const actions = {
      setPage: setter('page'),
      setSort: setter('sort'),
      thrower() {
        store.setState((old: TestState) => {
          throw new Error('my error');
        });
      },
      syncThrower() {
        store.setState((old: TestState) => {
          throw new Error('my sync error');
        });
        store.flushSync();
      },
    };
    store = new Store({
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
          <button onClick={() => setPage((old: number) => old + 1)}>
            Next
          </button>
          <button onClick={thrower as MouseEventHandler}>Throw</button>
          <button onClick={syncThrower as MouseEventHandler}>syncThrow</button>
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
    store.on('BeforeReset', (evt: PreventableEvent) => {
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
    let error: any;
    store.on('SetterException', (evt: PreventableEvent) => (error = evt.data));
    const { getByText } = render(<ListComponent />);
    await act(() => {
      fireEvent.click(getByText('Throw'));
    });
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('my error');
  });
  it('should fire SetterException on flushSync', async () => {
    let error: any;
    store.on('SetterException', (evt: PreventableEvent) => (error = evt.data));
    const { getByText } = render(<ListComponent />);
    await act(() => {
      fireEvent.click(getByText('syncThrow'));
    });
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('my sync error');
  });
  it('should fire SetterException on rejected promise', async () => {
    let rejection;
    store.on(
      'SetterException',
      (evt: PreventableEvent) => (rejection = evt.data)
    );
    store.addActions({
      promiseThatRejects: () => {
        store.setState(() => {
          return Promise.reject('my rejection');
        });
      },
    });
    store.actions.promiseThatRejects();
    await new Promise(r => setTimeout(r, 15));
    expect(rejection).toBe('my rejection');
  });
});
describe('new Store() flushSync', () => {
  // define store before each test
  let store: Store;
  beforeEach(() => {
    const state = { page: 1, sort: '-date' };
    const actions = {
      setPage: setter('page'),
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
      }
    };
    store = new Store({
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
    store.actions.setPage((old: number) => old + 2);
    expect(store.getState().page).toBe(1);
    store.flushSync();
    expect(store.getState().page).toBe(4);
  });
  it('should flushSync with 1 function', () => {
    store.actions.setPage((old: number) => old + 1);
    expect(store.getState().page).toBe(1);
    store.flushSync();
    expect(store.getState().page).toBe(2);
  });
  it('should flushSync with 2 functions', () => {
    store.actions.setPage((old: number) => old + 1);
    store.actions.setPage((old: number) => old + 1);
    expect(store.getState().page).toBe(1);
    store.flushSync();
    expect(store.getState().page).toBe(3);
  });
  it('should handle promise in flushSync', async () => {
    store.actions.promise();
    expect(store.getState().page).toBe(1);
    const newState = store.flushSync();
    expect(newState.page).toBe(1);
    expect(store.getState().page).toBe(1);
    await new Promise(r => setTimeout(r, 30));
    expect(store.getState().page).toBe(17);
  });
  it('should handle promise error in flushSync', async () => {
    let sawError;
    store.on(
      'SetterException',
      (evt: PreventableEvent) => (sawError = evt.data)
    );
    store.actions.promiseError();
    store.flushSync();
    expect(store.getState().page).toBe(1);
    await new Promise(r => setTimeout(r, 30));
    expect(sawError).toBeInstanceOf(Error);
    expect(store.getState().page).toBe(1);
  });
  it('should handle BeforeSet with preventDefault in flushSync', () => {
    store.on('BeforeSet', (evt: PreventableEvent) => {
      evt.preventDefault();
    });
    store.actions.setPage((old: number) => old + 1);
    expect(store.getState().page).toBe(1);
    store.flushSync();
    expect(store.getState().page).toBe(1);
  });
  it('should handle BeforeUpdate with preventDefault in flushSync', () => {
    store.on('BeforeUpdate', (evt: PreventableEvent) => {
      evt.preventDefault();
    });
    store.actions.setPage((old: number) => old + 1);
    expect(store.getState().page).toBe(1);
    store.flushSync();
    expect(store.getState().page).toBe(1);
  });
});
describe('new Store() cloning', () => {
  // define store before each test
  let store: Store;
  beforeEach(() => {
    const state = { page: 1, sort: '-date' };
    const actions = {
      setPage: setter('page'),
      setSort: setter('sort'),
    };
    store = new Store({
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
describe('new Store() middleware', () => {
  // define store before each test
  let store: Store;
  beforeEach(() => {
    store = new Store({
      state: { page: 1, sort: '-date' },
      actions: {
        setPage: setter('page'),
        setSort: setter('sort'),
      },
    });
  });
  it('should allow spying middleware', async () => {
    const spy = vitest.fn();
    store.use((ctx: MiddlewareContextInterface, next: Function) => {
      spy(ctx);
      next();
    });
    store.actions.setPage(2);
    await store.nextState();
    expect(store.getState().page).toBe(2);
    expect(spy).toHaveBeenCalledWith({
      prev: { page: 1, sort: '-date' },
      next: { page: 2, sort: '-date' },
      isAsync: true,
      store,
    });
  });
  it('should allow non-nexting middleware', async () => {
    const spy = vitest.fn();
    store.use((ctx: MiddlewareContextInterface, next: Function) => {
      spy(ctx);
    });
    store.actions.setPage(2);
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState().page).toBe(1);
    expect(spy).toHaveBeenCalledWith({
      prev: { page: 1, sort: '-date' },
      next: { page: 2, sort: '-date' },
      isAsync: true,
      store,
    });
  });
  it('should allow spying sync middleware', () => {
    const spy = vitest.fn();
    store.use((ctx: MiddlewareContextInterface, next: Function) => {
      spy(ctx);
      next();
    });
    store.actions.setPage(2);
    store.flushSync();
    expect(store.getState().page).toBe(2);
    expect(spy).toHaveBeenCalledWith({
      prev: { page: 1, sort: '-date' },
      next: { page: 2, sort: '-date' },
      isAsync: false,
      store,
    });
  });
  it('should allow non-nexting sync middleware', () => {
    const spy = vitest.fn();
    store.use((ctx: MiddlewareContextInterface, next: Function) => {
      spy(ctx);
    });
    store.actions.setPage(2);
    store.flushSync();
    expect(store.getState().page).toBe(1);
    expect(spy).toHaveBeenCalledWith({
      prev: { page: 1, sort: '-date' },
      next: { page: 2, sort: '-date' },
      isAsync: false,
      store,
    });
  });
});
