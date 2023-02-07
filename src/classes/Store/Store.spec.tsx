import React, { FunctionComponent, MouseEventHandler, useState } from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { vitest } from 'vitest';
import '@testing-library/jest-dom';
import useStoreState from '../../hooks/useStoreState/useStoreState';
import { setter } from '../../actions/setter/setter';
import Store from './Store';
import { PluginFunctionType } from '../../types';

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
        ctx.prev.foo = 'bar';
      } catch (e) {
        error = e;
      }
      done();
    });
    store.setState({ a: 2 });
    expect(error).toBeInstanceOf(Error);
    expect(store.getState()).toEqual({ a: 2 });
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
  // it('should make setters from actions', async () => {
  //   const store = new Store({ age: 14, user: { name: 'me' } });
  //   const setAge = store.connect(setter('age'));
  //   const setName = store.connect(setter('user.name'));
  //   expect(typeof setAge).toBe('function');
  //   expect(typeof setName).toBe('function');
  //   setAge(15);
  //   const awaited = await store.nextState();
  //   expect(awaited).toEqual({ age: 15, user: { name: 'me' } });
  //   expect(store.getState()).toEqual({ age: 15, user: { name: 'me' } });
  //   setName('John Doe');
  //   await store.nextState();
  //   expect(store.getState()).toEqual({ age: 15, user: { name: 'John Doe' } });
  // });
  // it('should unwrap promises', async () => {
  //   const store = new Store({ age: 10 });
  //   store.setState(Promise.resolve({ age: 11 }));
  //   await store.nextState();
  //   expect(store.getState()).toEqual({ age: 11 });
  // });
  // it('should get initial state', async () => {
  //   const store = new Store({ age: 10 });
  //   store.setState({ age: 42 });
  //   expect(store.getInitialState()).toEqual({ age: 10 });
  // });
  // it('should get initial state at', async () => {
  //   const store = new Store({ age: 10 });
  //   store.setState({ age: 42 });
  //   expect(store.getInitialStateAt('age')).toEqual(10);
  // });
  // it('should reset state', async () => {
  //   const store = new Store({ age: 10 });
  //   const setAge = store.connect(setter('age'));
  //   setAge(11);
  //   await store.nextState();
  //   store.resetState();
  //   await store.nextState();
  //   expect(store.getState()).toEqual({ age: 10 });
  // });
  // it('should reset state synchronously', () => {
  //   const store = new Store({ age: 10 });
  //   const setAge = store.connect(setter('age'));
  //   setAge(11);
  //   store.resetSync();
  //   expect(store.getState()).toEqual({ age: 10 });
  // });
  // it('should reset state at', async () => {
  //   const store = new Store({ bio: { age: 10 } });
  //   const setAge = store.connect(setter('bio.age'));
  //   setAge(11);
  //   await store.nextState();
  //   store.resetStateAt('bio.age');
  //   await store.nextState();
  //   expect(store.getState()).toEqual({ bio: { age: 10 } });
  // });
  // it('should reset state synchronously at', () => {
  //   const store = new Store({ bio: { age: 10 } });
  //   const setAge = store.connect(setter('bio.age'));
  //   setAge(11);
  //   store.resetSyncAt('bio.age');
  //   expect(store.getState()).toEqual({ bio: { age: 10 } });
  // });
  // it('should reset store', async () => {
  //   const store = new Store({ age: 10 });
  //   const setAge = store.connect(setter('age'));
  //   setAge(11);
  //   await store.nextState();
  //   store.reset();
  //   await store.nextState();
  //   expect(store.getState()).toEqual({ age: 10 });
  // });
  // it('should setState with Promise', async () => {
  //   const store = new Store(42);
  //   expect(store.getState()).toBe(42);
  //   store.setState(Promise.resolve(43));
  //   const newState = await store.nextState();
  //   expect(newState).toBe(43);
  // });
  // it('should setState with function that returns Promise', async () => {
  //   const store = new Store(42);
  //   expect(store.getState()).toBe(42);
  //   store.setState(old => Promise.resolve(old + 1));
  //   const newState = await store.nextState();
  //   expect(newState).toBe(43);
  // });
  // it('should mergeState with Promise', async () => {
  //   type TestState = {
  //     count: number;
  //     view: 'list' | 'grid';
  //   };
  //   const state = { count: 42, view: 'list' };
  //   const store = new Store(state);
  //   expect(store.getState()).toBe(state);
  //   store.mergeState((old: TestState) =>
  //     Promise.resolve({ count: old.count + 1 })
  //   );
  //   await store.nextState();
  //   expect(store.getState()).toEqual({ count: 43, view: 'list' });
  // });
  // it('should mergeStateAt with value', async () => {
  //   const state = {
  //     price: { usd: 100 },
  //     variant: { color: 'blue', size: 'XL', length: 'R' },
  //   };
  //   const store = new Store(state);
  //   store.mergeStateAt('variant', { size: '2XL', length: 'T' });
  //   await store.nextState();
  //   expect(store.getState()).not.toBe(state);
  //   expect(store.getState().price).toBe(state.price);
  //   expect(store.getState()).toEqual({
  //     price: { usd: 100 },
  //     variant: { color: 'blue', size: '2XL', length: 'T' },
  //   });
  // });
  // it('should mergeStateAt with promise', async () => {
  //   const state = {
  //     price: { usd: 100 },
  //     variant: { color: 'blue', size: 'XL' },
  //   };
  //   const store = new Store(state);
  //   store.mergeStateAt('variant', Promise.resolve({ size: 'S', back: 'logo' }));
  //   await store.nextState();
  //   expect(store.getState()).not.toBe(state);
  //   expect(store.getState().price).toBe(state.price);
  //   expect(store.getState()).toEqual({
  //     price: { usd: 100 },
  //     variant: { color: 'blue', size: 'S', back: 'logo' },
  //   });
  // });
  // it('should mergeStateAt with function', async () => {
  //   const state = {
  //     price: { usd: 100 },
  //     variant: { color: 'blue', size: 'XL' },
  //   };
  //   const store = new Store(state);
  //   store.mergeStateAt('variant', () => ({ size: 'M', material: 'Cotton' }));
  //   await store.nextState();
  //   expect(store.getState()).not.toBe(state);
  //   expect(store.getState().price).toBe(state.price);
  //   expect(store.getState()).toEqual({
  //     price: { usd: 100 },
  //     variant: { color: 'blue', size: 'M', material: 'Cotton' },
  //   });
  // });
  // it('should mergeSyncAt with value', () => {
  //   const state = {
  //     price: { usd: 100 },
  //     variant: { color: 'blue', size: 'XL', material: null },
  //   };
  //   const store = new Store(state);
  //   store.mergeSyncAt('variant', { size: 'M', material: 'Cotton' });
  //   expect(store.getState()).toEqual({
  //     price: { usd: 100 },
  //     variant: { color: 'blue', size: 'M', material: 'Cotton' },
  //   });
  // });
  // it('should mergeSyncAt with function', () => {
  //   const state = {
  //     price: { usd: 100 },
  //     variant: { color: 'blue', size: 'XL' },
  //   };
  //   const store = new Store(state);
  //   store.mergeSyncAt('variant', () => ({ size: 'M', material: 'Cotton' }));
  //   expect(store.getState()).toEqual({
  //     price: { usd: 100 },
  //     variant: { color: 'blue', size: 'M', material: 'Cotton' },
  //   });
  // });
  // it('should setSync', () => {
  //   const state = { count: 5 };
  //   const store = new Store(state);
  //   expect(store.getState()).toBe(state);
  //   store.setSync({ count: 6 });
  //   expect(store.getState()).toEqual({ count: 6 });
  // });
  // it('should setSync with function', () => {
  //   const state = 42;
  //   const store = new Store(state);
  //   expect(store.getState()).toBe(state);
  //   store.setSync(old => old + 1);
  //   expect(store.getState()).toBe(43);
  // });
  // it('should mergeSync', () => {
  //   const state = { count: 5, mode: 'up' };
  //   const store = new Store(state);
  //   expect(store.getState()).toBe(state);
  //   store.mergeSync({ count: 6 });
  //   expect(store.getState()).toEqual({ count: 6, mode: 'up' });
  // });
  // it('should setSync with function', () => {
  //   type TestState = {
  //     count: number;
  //     mode: string;
  //   };
  //   const state = { count: 5, mode: 'up' };
  //   const store = new Store(state);
  //   expect(store.getState()).toBe(state);
  //   store.mergeSync(old => ({ count: old.count + 1 }));
  //   expect(store.getState()).toEqual({ count: 6, mode: 'up' });
  // });
  // it('should allow plugins', () => {
  //   const spy: Function = vitest.fn();
  //   const store = new Store();
  //   store.plugin(spy as PluginFunctionType);
  //   expect(spy).toHaveBeenCalledWith(store);
  //   expect(store.getPlugins()).toEqual([spy]);
  // });
  // it('should throw on missing plugins', () => {
  //   const store = new Store();
  //   const throwers = [
  //     store.subscribe,
  //     store.undo,
  //     store.redo,
  //     store.jump,
  //     store.jumpTo,
  //     store.getHistory,
  //   ];
  //   for (const thrower of throwers) {
  //     expect(thrower).toThrow();
  //   }
  // });
  // it('should setSyncAt(path, value)', () => {
  //   const store = new Store({ hello: { world: 42 } });
  //   store.setSyncAt('hello.world', 44);
  //   expect(store.getStateAt('hello.world')).toBe(44);
  //   expect(store.getState().hello.world).toBe(44);
  // });
  // it('should setSyncAt(path, transformer)', () => {
  //   const state = { hello: { world: 42 } };
  //   const store = new Store(state);
  //   store.setSyncAt('hello.world', num => num + 1);
  //   expect(store.getState().hello.world).toBe(43);
  //   expect(store.getStateAt('hello.world')).toBe(43);
  // });
  // it('should setStateAt(path, value)', () => {
  //   const store = new Store({ hello: { world: 42 } });
  //   store.setStateAt('hello.world', 44);
  //   store.flushSync();
  //   expect(store.getState().hello.world).toBe(44);
  // });
  // it('should setStateAt(path, transformer)', () => {
  //   const store = new Store({ hello: { world: 42 } });
  //   store.setStateAt('hello.world', s => s + 1);
  //   store.flushSync();
  //   expect(store.getState().hello.world).toBe(43);
  // });
  // it('should getStateAt(path)', () => {
  //   const store = new Store({ hello: { world: 42 } });
  //   expect(store.getStateAt('hello.world')).toBe(42);
  // });
  // it('should getStateAt(path) with asterisk', () => {
  //   const store = new Store({
  //     books: [
  //       {
  //         title: 'JavaScript ABCs',
  //         authors: [
  //           { name: 'John A', rating: 2 },
  //           { name: 'Kyle B', rating: 4 },
  //         ],
  //       },
  //       {
  //         title: 'Web Tech Rocks',
  //         authors: [{ name: 'Owen C', rating: 5 }],
  //       },
  //     ],
  //   });
  //   expect(store.getStateAt('books.*.authors.*.rating')).toEqual([2, 4, 5]);
  // });
  // it('should setStateAt(path, transformer) with asterisk', () => {
  //   const state = {
  //     books: [
  //       { title: 'One', ratings: [2.4, 3.1, 4.5] },
  //       { title: 'Two', ratings: [5.3, 7.8, 9.1] },
  //     ],
  //   };
  //   const store = new Store(state);
  //   store.setStateAt('books.*.ratings.*', Math.round);
  //   store.flushSync();
  //   expect(store.getState()).toEqual({
  //     books: [
  //       { title: 'One', ratings: [2, 3, 5] },
  //       { title: 'Two', ratings: [5, 8, 9] },
  //     ],
  //   });
  // });
  // it('should setStateAt(path, value) with asterisk', () => {
  //   const state = {
  //     books: [
  //       { title: 'One', ratings: [2.4, 3.1, 4.5] },
  //       { title: 'Two', ratings: [5.3, 7.8, 9.1] },
  //     ],
  //   };
  //   const store = new Store(state);
  //   store.setStateAt('books.*.ratings.*', 5);
  //   store.flushSync();
  //   expect(store.getState()).toEqual({
  //     books: [
  //       { title: 'One', ratings: [5, 5, 5] },
  //       { title: 'Two', ratings: [5, 5, 5] },
  //     ],
  //   });
  // });
  // it('should setStateAt(path, promise) with asterisk', async () => {
  //   const state = {
  //     books: [
  //       { title: 'One', ratings: [2.4, 3.1, 4.5] },
  //       { title: 'Two', ratings: [5.3, 7.8, 9.1] },
  //     ],
  //   };
  //   const store = new Store(state);
  //   store.setStateAt('books.*.ratings.*', Promise.resolve(5));
  //   const next = await store.nextState();
  //   expect(next).toEqual({
  //     books: [
  //       { title: 'One', ratings: [5, 5, 5] },
  //       { title: 'Two', ratings: [5, 5, 5] },
  //     ],
  //   });
  // });
  // it('should extendSync(moreState)', () => {
  //   type GlobalSchemaType = {
  //     hello?: {
  //       world: number;
  //     };
  //     foo?: string;
  //   };
  //   const initialState: GlobalSchemaType = { hello: { world: 42 } };
  //   const store = new Store(initialState);
  //   const ret = store.extendSync({ foo: 'bar' });
  //   expect(store.getState()).toBe(initialState);
  //   // @ts-ignore
  //   expect(store.getState().foo).toBe('bar');
  //   expect(ret).toBe(store);
  // });
  // it('should throw if extendSync(moreState) moreState not an object', () => {
  //   const initialState = { hello: { world: 42 } };
  //   const store = new Store({ state: initialState });
  //   const thrower = () => {
  //     // @ts-ignore
  //     store.extendSync(42);
  //   };
  //   expect(thrower).toThrow();
  // });
  // it('should extendSyncAt(path, moreState)', () => {
  //   type StateType = {
  //     user: {
  //       permissions: {
  //         createPosts: boolean;
  //         adminSettings?: boolean;
  //       };
  //     };
  //   };
  //   const initialState = { user: { permissions: { createPosts: true } } };
  //   const store = new Store<StateType>(initialState);
  //   const ret = store.extendSyncAt('user.permissions', {
  //     adminSettings: false,
  //   });
  //   // it should extend but not change the store state
  //   expect(store.getState()).toBe(initialState);
  //   // @ts-ignore
  //   expect(store.getState().user.permissions.adminSettings).toBe(false);
  //   expect(ret).toBe(store);
  // });
  // it('should throw if extendSyncAt(path, moreState) moreState not an object', async () => {
  //   const initialState = { hello: { world: 42 } };
  //   const store = new Store(initialState);
  //   const thrower = () => {
  //     // @ts-ignore
  //     store.extendSyncAt('hello.world', 44);
  //   };
  //   expect(thrower).toThrow();
  // });
  // it('should throw if extendSyncAt(path, moreState) moreState not an object', async () => {
  //   const initialState = { hello: { world: 42 } };
  //   const store = new Store(initialState);
  //   const thrower = () => {
  //     // @ts-ignore
  //     store.extendSyncAt('hello.friend', { cool: true });
  //   };
  //   expect(thrower).toThrow();
  // });
});
describe.skip('new Store() with autoReset', () => {
  // define store before each test
  let store: Store;
  let ListComponent: FunctionComponent;
  let PageComponent: FunctionComponent;
  let setPage;
  let setSort;
  let thrower;
  let syncThrower;
  beforeEach(() => {
    const state = { page: 1, sort: '-date' };
    store = new Store(state, {
      autoReset: true,
    });
    setPage = store.connect(setter('page'));
    setSort = store.connect(setter('sort'));
    thrower = () => {
      store.setState(() => {
        throw new Error('my error');
      });
    };
    syncThrower = () => {
      store.setState(() => {
        throw new Error('my sync error');
      });
      store.flushSync();
    };
    ListComponent = () => {
      const state = useStoreState(store);
      return (
        <div className="List">
          <span>page={state.page}</span>
          <button onClick={() => setPage(old => old + 1)}>Next</button>
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
    let error: any;
    store.on('SetterException', evt => (error = evt.data));
    const { getByText } = render(<ListComponent />);
    await act(() => {
      fireEvent.click(getByText('syncThrow'));
    });
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('my sync error');
  });
  it('should fire SetterException on rejected promise', async () => {
    let rejection;
    store.on('SetterException', evt => (rejection = evt.data));
    store.setState(Promise.reject('my rejection'));
    await new Promise(r => setTimeout(r, 15));
    expect(rejection).toBe('my rejection');
  });
  it('should fire SetterException on function returning rejected promise', async () => {
    let rejection;
    store.on('SetterException', evt => (rejection = evt.data));
    store.setState(() => {
      return Promise.reject('my rejection');
    });
    await new Promise(r => setTimeout(r, 15));
    expect(rejection).toBe('my rejection');
  });
  it('should fire SetterException on rejected promise on setSync', async () => {
    let rejection;
    store.on('SetterException', evt => (rejection = evt.data));
    store.setSync(Promise.reject('my rejection'));
    await new Promise(r => setTimeout(r, 15));
    expect(rejection).toBe('my rejection');
  });
});

describe.skip('new Store() flushSync', () => {
  // define store before each test
  let store;
  let setPage;
  let pwn;
  let promise;
  let promiseError;
  beforeEach(() => {
    const state = { page: 1, sort: '-date' };
    store = new Store(state);
    setPage = store.connect(setter('page'));
    pwn = () => store.setState({ pwned: 42 });
    promise = () => {
      store.setState(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve({ page: 17, sort: 'date' }), 15);
        });
      });
    };
    promiseError = () => {
      store.setState(() => {
        return new Promise(() => {
          throw new Error('Scooby Doo');
        });
      });
    };
  });
  it('should flushSync with values', () => {
    setPage(2);
    expect(store.getState().page).toBe(1);
    store.flushSync();
    expect(store.getState().page).toBe(2);
  });
  it('should flushSync with state replacement', () => {
    pwn();
    expect(store.getState().page).toBe(1);
    store.flushSync();
    expect(store.getState()).toEqual({ pwned: 42 });
  });
  it('should flushSync with values and functions', () => {
    setPage(2);
    setPage(old => old + 2);
    expect(store.getState().page).toBe(1);
    store.flushSync();
    expect(store.getState().page).toBe(4);
  });
  it('should flushSync with 1 function', () => {
    setPage(old => old + 1);
    expect(store.getState().page).toBe(1);
    store.flushSync();
    expect(store.getState().page).toBe(2);
  });
  it('should flushSync with 2 functions', () => {
    setPage(old => old + 1);
    setPage(old => old + 1);
    expect(store.getState().page).toBe(1);
    store.flushSync();
    expect(store.getState().page).toBe(3);
  });
  it('should handle promise in flushSync', async () => {
    promise();
    expect(store.getState().page).toBe(1);
    const newState = store.flushSync();
    expect(newState.page).toBe(1);
    expect(store.getState().page).toBe(1);
    await new Promise(r => setTimeout(r, 30));
    expect(store.getState().page).toBe(17);
  });
  it('should handle promise error in flushSync', async () => {
    let sawError;
    store.on('SetterException', evt => (sawError = evt.data));
    promiseError();
    store.flushSync();
    expect(store.getState().page).toBe(1);
    await new Promise(r => setTimeout(r, 30));
    expect(sawError).toBeInstanceOf(Error);
    expect(store.getState().page).toBe(1);
  });
});
describe.skip('new Store() middleware', () => {
  // define store before each test
  let store;
  let setPage;
  let setSort;
  beforeEach(() => {
    store = new Store({ page: 1, sort: '-date' });
    setPage = store.connect(setter('page'));
    setSort = store.connect(setter('sort'));
  });
  it('should allow altering state', async () => {
    store.use((ctx, next) => {
      ctx.next.limit = 10;
      next();
    });
    setPage(2);
    await store.nextState();
    expect(store.getState()).toEqual({ page: 2, sort: '-date', limit: 10 });
  });
  it('should allow spying middleware', async () => {
    const spy = vitest.fn();
    store.use((ctx, next) => {
      spy(ctx);
      next();
    });
    setPage(2);
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
    store.use((ctx, next) => {
      spy(ctx);
    });
    setPage(2);
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
    store.use((ctx, next) => {
      spy(ctx);
      next();
    });
    setPage(2);
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
    store.use((ctx, next) => {
      spy(ctx);
    });
    setPage(2);
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
