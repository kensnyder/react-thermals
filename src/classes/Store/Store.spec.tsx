import { FunctionComponent, MouseEventHandler, useState } from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { vitest } from 'vitest';
import '@testing-library/jest-dom';
import useStoreState from '../../hooks/useStoreState/useStoreState';
import { setter } from '../../actions/setter/setter';
import Store from './Store';
import type { PluginFunctionType } from '../../types';
import remover from '../../actions/remover/remover';

describe('Store constructor', () => {
  it('should have an id', () => {
    const store = new Store();
    expect(typeof store.id).toBe('string');
  });
  it('should have a locals object', () => {
    const store = new Store();
    expect(typeof store.locals).toBe('object');
  });
});
describe('Store getState', () => {
  it('should return initial state', () => {
    const state = {};
    const store = new Store(state);
    expect(store.getInitialState()).toBe(state);
  });
  it('should return state', () => {
    const state = { a: 1 };
    const store = new Store(state);
    expect(store.getInitialState()).toBe(state);
  });
  it('should return initial state at path', () => {
    const state = { a: 1 };
    const store = new Store(state);
    expect(store.getInitialStateAt('a')).toBe(1);
  });
  it('should return state at path', () => {
    const state = { a: 1 };
    const store = new Store(state);
    expect(store.getStateAt('a')).toBe(1);
  });
});
describe('Store setState sync', () => {
  it('should return Store itself', () => {
    const state = { a: 1 };
    const store = new Store(state);
    const newState = { a: 2 };
    expect(store.setState(newState)).toBe(store);
  });
  it('should set entire state', () => {
    const state = { a: 1 };
    const store = new Store(state);
    const newState = { a: 2 };
    store.setState(newState);
    expect(store.getState()).toBe(newState);
  });
  it('should set entire with function', () => {
    const state = { a: 1 };
    const store = new Store(state);
    const newState = old => ({ a: old.a + 1 });
    store.setState(newState);
    expect(store.getState()).toEqual({ a: 2 });
  });
  it('should set entire with function twice', () => {
    const state = { a: 1 };
    const store = new Store(state);
    const newState = old => ({ a: old.a + 1 });
    store.setState(newState);
    store.setState(newState);
    expect(store.getState()).toEqual({ a: 3 });
  });
  it('should fire AfterUpdate on next tick', async () => {
    const state = { a: 1 };
    const store = new Store(state);
    const newState = old => ({ a: old.a + 1 });
    store.setState(newState);
    const next = await store.nextState();
    expect(next).toEqual({ a: 2 });
  });
});
describe('Store middleware', () => {
  it('should run pass correct context to middleware', () => {
    const state = { a: 1 };
    const store = new Store(state);
    let context;
    store.use((ctx, done) => {
      context = ctx;
      done();
    });
    const newState = old => ({ a: old.a + 1 });
    store.setState(newState);
    expect(context).toEqual({
      prev: { a: 1 },
      next: { a: 2 },
      store,
    });
  });
  it('should allow altering new state', () => {
    const state = { a: 1 };
    const store = new Store(state);
    store.use((ctx, done) => {
      ctx.next = { a: 10 };
      done();
    });
    const newState = old => ({ a: old.a + 1 });
    store.setState(newState);
    expect(store.getState()).toEqual({ a: 10 });
  });
  it('should allow altering new state twice', () => {
    const state = { a: 1 };
    const store = new Store(state);
    const times10 = (ctx, done) => {
      ctx.next.a *= 10;
      done();
    };
    store.use(times10);
    store.use(times10);
    const newState = old => ({ a: old.a + 1 });
    store.setState(newState);
    expect(store.getState()).toEqual({ a: 200 });
  });
  it('should allow awaiting next state', async () => {
    const state = { a: 1 };
    const store = new Store(state);
    store.use((ctx, done) => {
      ctx.next = { a: 10 };
      setTimeout(done, 0);
    });
    store.setState({ a: 2 });
    const next = await store.nextState();
    expect(next).toEqual({ a: 10 });
    expect(store.getState()).toEqual({ a: 10 });
  });
  it('should freeze context.prev object', () => {
    const state = { a: 1 };
    const store = new Store(state);
    let error;
    store.use((ctx, done) => {
      try {
        ctx.prev.a = 100;
      } catch (e) {
        error = e;
      }
      done();
    });
    store.setState({ a: 2 });
    expect(error).toBeInstanceOf(Error);
    expect(store.getState()).toEqual({ a: 2 });
  });
  it('should allow bypassing middleware', () => {
    const state = { a: 1 };
    const store = new Store(state);
    const spy = vitest.fn();
    store.use(spy);
    store.setState({ a: 42 }, { bypassMiddleware: true });
    expect(store.getState()).toEqual({ a: 42 });
    expect(spy).not.toHaveBeenCalled();
  });
});
describe('Store setState async', () => {
  it('should resolve promises', async () => {
    const state = { a: 1 };
    const store = new Store(state);
    const newState = Promise.resolve({ a: 2 });
    store.setState(newState);
    const next = await store.nextState();
    expect(next).toEqual({ a: 2 });
    expect(store.getState()).toEqual({ a: 2 });
  });
  it('should resolve functions that return promises', async () => {
    const state = { a: 1 };
    const store = new Store(state);
    const newState = old => Promise.resolve({ a: old.a * 10 });
    store.setState(newState);
    const next = await store.nextState();
    expect(next).toEqual({ a: 10 });
    expect(store.getState()).toEqual({ a: 10 });
  });
  it('should resolve two async changes', async () => {
    const state = { a: 1 };
    const store = new Store(state);
    store.setState(Promise.resolve({ a: 2 }));
    store.setState(old => ({ a: old.a * 10 }));
    const next = await store.nextState();
    expect(next).toEqual({ a: 20 });
    expect(store.getState()).toEqual({ a: 20 });
  });
  it('should bypassEvent', async () => {
    const eventSpy = vitest.fn();
    const state = { a: 1 };
    const store = new Store(state);
    store.on('AfterUpdate', eventSpy);
    store.setState(Promise.resolve({ a: 2 }), { bypassEvent: true });
    await new Promise(r => setTimeout(r, 15));
    expect(eventSpy).not.toHaveBeenCalled();
    expect(store.getState()).toEqual({ a: 2 });
  });
  it('should bypassAll', async () => {
    const eventSpy = vitest.fn();
    const state = { a: 1 };
    const store = new Store(state);
    store.on('AfterUpdate', eventSpy);
    store.initState({ a: 2 });
    expect(eventSpy).not.toHaveBeenCalled();
    expect(store.getState()).toEqual({ a: 2 });
  });
  it('should bypassAll at path', async () => {
    const eventSpy = vitest.fn();
    const state = { letters: { a: 1 } };
    const store = new Store(state);
    store.on('AfterUpdate', eventSpy);
    store.initStateAt('letters', { a: 2 });
    expect(eventSpy).not.toHaveBeenCalled();
    expect(store.getState()).toEqual({ letters: { a: 2 } });
  });
  it('should fire SetterRejection when setState callback throws', async () => {
    const state = { a: 1 };
    const store = new Store(state);
    let rejection;
    store.on('SetterRejection', evt => (rejection = evt.data));
    store.setState(old => {
      return Promise.reject('my rejection');
    });
    await new Promise(r => setTimeout(r, 15));
    expect(rejection).toBe('my rejection');
  });
  it('should fire SetterRejection when setState callback throws', async () => {
    const state = { a: 1 };
    const store = new Store(state);
    let rejection;
    store.on('SetterRejection', evt => (rejection = evt.data));
    store.setStateAt('a', old => {
      return Promise.reject('my rejection 2');
    });
    await new Promise(r => setTimeout(r, 15));
    expect(rejection).toBe('my rejection 2');
  });
  it('should fire SetterRejection on rejected promise', async () => {
    const state = { a: 1 };
    const store = new Store(state);
    let rejection;
    store.on('SetterRejection', evt => (rejection = evt.data));
    store.setState(Promise.reject('my rejection 3'));
    await new Promise(r => setTimeout(r, 15));
    expect(rejection).toBe('my rejection 3');
  });
  it('should fire SetterRejection on function returning rejected promise', async () => {
    const state = { a: 1 };
    const store = new Store(state);
    let rejection;
    store.on('SetterRejection', evt => (rejection = evt.data));
    store.setState(() => {
      return Promise.reject('my rejection 4');
    });
    await new Promise(r => setTimeout(r, 15));
    expect(rejection).toBe('my rejection 4');
  });
});
describe('Store setStateAt', () => {
  it('should update state one level deep', async () => {
    const state = { a: 1 };
    const store = new Store(state);
    store.setStateAt('a', 2);
    const next = await store.nextState();
    expect(next).toEqual({ a: 2 });
  });
  it('should update state one level deep with function', async () => {
    const state = { a: 1 };
    const store = new Store(state);
    store.setStateAt('a', old => old * 7);
    const next = await store.nextState();
    expect(next).toEqual({ a: 7 });
  });
  it('should update state two levels deep', async () => {
    const state = { alphabet: { a: 1 } };
    const store = new Store(state);
    store.setStateAt('alphabet.a', 2);
    const next = await store.nextState();
    expect(next).toEqual({ alphabet: { a: 2 } });
  });
  it('should update state two levels deep with function', async () => {
    const state = { alphabet: { a: 1 } };
    const store = new Store(state);
    store.setStateAt('alphabet.a', old => old * 5);
    const next = await store.nextState();
    expect(next).toEqual({ alphabet: { a: 5 } });
  });
  it('should update state with a Promise', async () => {
    const state = { a: 1 };
    const store = new Store(state);
    store.setStateAt('a', 2);
    const next = await store.nextState();
    expect(next).toEqual({ a: 2 });
  });
  it('should update state with function that returns Promise', async () => {
    const state = { a: 1 };
    const store = new Store(state);
    store.setStateAt('a', Promise.resolve(3));
    const next = await store.nextState();
    expect(next).toEqual({ a: 3 });
  });
  it('should update path with asterisk', async () => {
    const state = { primes: [2, 3, 5, 7] };
    const store = new Store(state);
    store.setStateAt('primes.*', 11);
    const next = await store.nextState();
    expect(next).toEqual({ primes: [11, 11, 11, 11] });
  });
  it('should update path with asterisk with function', async () => {
    const state = { primes: [2, 3, 5, 7] };
    const store = new Store(state);
    // type-fest's Get<> doesn't understand asterisks, so we have to suppress error
    // @ts-ignore
    store.setStateAt('primes.*', old => old * 11);
    const next = await store.nextState();
    expect(next).toEqual({ primes: [22, 33, 55, 77] });
  });
  it('should update path with asterisk with function that returns Promise', async () => {
    const state = { primes: [2, 3, 5, 7] };
    const store = new Store(state);
    // type-fest's Get<> doesn't understand asterisks, so we have to suppress error
    // @ts-ignore
    store.setStateAt('primes.*', old => Promise.resolve(old * 11));
    const next = await store.nextState();
    expect(next).toEqual({ primes: [22, 33, 55, 77] });
  });
});
describe('Store resetState', () => {
  it('should reset state', async () => {
    const store = new Store({ age: 10 });
    store.setState({ age: 11 });
    await store.nextState();
    store.resetState();
    await store.nextState();
    expect(store.getState()).toEqual({ age: 10 });
  });
  it('should reset state at path', async () => {
    const store = new Store({ name: 'Joe', age: 10 });
    store.setState({ name: 'Jane', age: 11 });
    await store.nextState();
    store.resetStateAt('name');
    await store.nextState();
    expect(store.getState()).toEqual({ name: 'Joe', age: 11 });
  });
});
describe('Store mergeState', () => {
  it('should merge state', async () => {
    const store = new Store({ name: 'Milo', age: 10 });
    store.mergeState({ age: 11 });
    await store.nextState();
    expect(store.getState()).toEqual({ name: 'Milo', age: 11 });
  });
  it('should merge state from Promise', async () => {
    const store = new Store({ name: 'Milo', age: 10 });
    store.mergeState(Promise.resolve({ age: 11 }));
    await store.nextState();
    expect(store.getState()).toEqual({ name: 'Milo', age: 11 });
  });
  it('should merge state from Function', async () => {
    const store = new Store({ name: 'Milo', age: 10 });
    store.mergeState(old => ({ age: old.age + 1 }));
    await store.nextState();
    expect(store.getState()).toEqual({ name: 'Milo', age: 11 });
  });
  it('should merge state from Function that returns Promise', async () => {
    const store = new Store({ name: 'Milo', age: 10 });
    store.mergeState(old => Promise.resolve({ age: old.age + 1 }));
    await store.nextState();
    expect(store.getState()).toEqual({ name: 'Milo', age: 11 });
  });
  it('should merge state at path', async () => {
    const store = new Store({ user: { name: 'Milo', age: 10 } });
    store.mergeStateAt('user', { age: 11 });
    await store.nextState();
    expect(store.getState()).toEqual({ user: { name: 'Milo', age: 11 } });
  });
  it('should merge state at path from Promise', async () => {
    const store = new Store({ user: { name: 'Milo', age: 10 } });
    store.mergeStateAt('user', Promise.resolve({ age: 11 }));
    await store.nextState();
    expect(store.getState()).toEqual({ user: { name: 'Milo', age: 11 } });
  });
  it('should merge state at path from Function', async () => {
    const store = new Store({ user: { name: 'Milo', age: 10 } });
    store.mergeStateAt('user', old => ({ age: old.age + 1 }));
    await store.nextState();
    expect(store.getState()).toEqual({ user: { name: 'Milo', age: 11 } });
  });
  it('should merge state at path from Function that returns promise', async () => {
    const store = new Store({ user: { name: 'Milo', age: 10 } });
    store.mergeStateAt('user', old => Promise.resolve({ age: old.age + 1 }));
    await store.nextState();
    expect(store.getState()).toEqual({ user: { name: 'Milo', age: 11 } });
  });
  it('should merge state at path with star', async () => {
    const store = new Store({
      options: [
        { name: 'one', isSelected: false },
        { name: 'two', isSelected: true },
        { name: 'three', isSelected: false },
      ],
    });
    store.mergeStateAt('options.*', { isSelected: true });
    await store.nextState();
    expect(store.getState()).toEqual({
      options: [
        { name: 'one', isSelected: true },
        { name: 'two', isSelected: true },
        { name: 'three', isSelected: true },
      ],
    });
  });
});

describe('Store plugins', () => {
  it('should allow plugins', () => {
    const spy: Function = vitest.fn();
    const store = new Store();
    store.plugin(spy as PluginFunctionType);
    expect(spy).toHaveBeenCalledWith(store);
    expect(store.getPlugins()).toEqual([spy]);
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
});

describe('Store actions', () => {
  it('should handle store.action()', () => {
    const users = [{ name: 'Joe' }, { name: 'Jane' }, { name: 'Milo' }];
    const store = new Store({ users });
    store.action(remover('users'), users[1]);
    expect(store.getState().users).toEqual([users[0], users[2]]);
  });
});

describe('Store() with components', () => {
  // define store before each test
  let store: Store;
  let ListComponent: FunctionComponent;
  let PageComponent: FunctionComponent;
  let setPage;
  beforeEach(() => {
    const state = { page: 1, sort: '-date' };
    store = new Store(state);
    setPage = store.connect(setter('page'));
    ListComponent = () => {
      const state = useStoreState(store);
      return (
        <div className="List">
          <span>page={state.page}</span>
          <button onClick={() => setPage(old => old + 1)}>Next</button>
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
  it('should persist state', async () => {
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
    expect(store.getState().page).toBe(2);
  });
});
describe('Store() with components - auto reset', () => {
  // define store before each test
  let store: Store;
  let ListComponent: FunctionComponent;
  let PageComponent: FunctionComponent;
  let setPage;
  let setSort;
  let thrower;
  beforeEach(() => {
    const state = { page: 1, sort: '-date' };
    store = new Store(state, {
      autoReset: true,
    });
    setPage = store.connect(setter('page'));
    setSort = store.connect(setter('sort'));
    thrower = () => {
      store.setState(Promise.reject('my error'));
    };
    ListComponent = () => {
      const state = useStoreState(store);
      return (
        <div className="List">
          <span>page={state.page}</span>
          <button onClick={() => setPage(old => old + 1)}>Next</button>
          <button onClick={thrower as MouseEventHandler}>Throw</button>
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
  it('should fire SetterRejection', async () => {
    let rejection;
    store.on('SetterRejection', evt => (rejection = evt.data));
    const { getByText } = render(<ListComponent />);
    await act(() => {
      fireEvent.click(getByText('Throw'));
    });
    expect(rejection).toBe('my error');
  });
});
