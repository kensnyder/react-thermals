import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Store from '../../src/Store/Store.js';
import persistState from './persistState.js';
import useStoreState from '../../src/useStoreState/useStoreState.js';

describe('persistState()', () => {
  // define store before each test
  let store, storage, Component;
  beforeEach(() => {
    const state = { page: 1, sort: '-date' };
    const actions = {
      setPage: page => store.mergeState({ page }),
      setSort: sort => store.mergeState({ sort }),
    };
    store = new Store({
      state,
      actions,
      id: 'myStore',
    });
    storage = {
      value: undefined,
      getItem: jest.fn(id => storage.value),
      setItem: jest.fn((id, val) => (storage.value = val)),
    };
    store.plugin(persistState({ storage }));
    Component = () => {
      const state = useStoreState(store);
      const { setPage } = store.actions;
      return (
        <div className="Pagination">
          <span>page={state.page}</span>
          <span>sort={state.sort}</span>
          <span onClick={() => setPage(state.page + 1)}>Next</span>
        </div>
      );
    };
  });
  it('should handle no initial state', () => {
    const { getByText } = render(<Component />);
    expect(getByText('page=1')).toBeInTheDocument();
    expect(getByText('sort=-date')).toBeInTheDocument();
    expect(storage.getItem).toHaveBeenCalledWith('myStore');
  });
  it('should override initial state', () => {
    storage.value = JSON.stringify({ page: 2, sort: '-date' });
    const { getByText } = render(<Component />);
    expect(getByText('page=2')).toBeInTheDocument();
    expect(getByText('sort=-date')).toBeInTheDocument();
    expect(storage.getItem).toHaveBeenCalledWith('myStore');
  });
  it('should save state', async () => {
    const { getByText } = render(<Component />);
    await act(() => {
      fireEvent.click(getByText('Next'));
    });
    expect(storage.value).toEqual(JSON.stringify({ page: 2, sort: '-date' }));
    expect(getByText('page=2')).toBeInTheDocument();
    expect(getByText('sort=-date')).toBeInTheDocument();
  });
});
describe('persistState() with fields', () => {
  // define store before each test
  let store, storage, Component;
  beforeEach(() => {
    const state = { page: 1, sort: '-date' };
    const actions = {
      setPage: page => store.mergeState({ page }),
      setSort: sort => store.mergeState({ sort }),
    };
    store = new Store({
      state,
      actions,
    });
    storage = {
      value: undefined,
      getItem: jest.fn(id => storage.value),
      setItem: jest.fn((id, val) => (storage.value = val)),
    };
    store.plugin(persistState({ storage, key: 'myKey', fields: ['page'] }));
    Component = () => {
      const state = useStoreState(store);
      const { setPage } = store.actions;
      return (
        <div className="Pagination">
          <span>page={state.page}</span>
          <span>sort={state.sort}</span>
          <span onClick={() => setPage(state.page + 1)}>Next</span>
        </div>
      );
    };
  });
  it('should handle no initial state', () => {
    const { getByText } = render(<Component />);
    expect(getByText('page=1')).toBeInTheDocument();
    expect(getByText('sort=-date')).toBeInTheDocument();
    expect(storage.getItem).toHaveBeenCalledWith('myKey');
  });
  it('should override initial state', () => {
    storage.value = JSON.stringify({ page: 2 });
    const { getByText } = render(<Component />);
    expect(getByText('page=2')).toBeInTheDocument();
    expect(getByText('sort=-date')).toBeInTheDocument();
    expect(storage.getItem).toHaveBeenCalledWith('myKey');
  });
  it('should save state', async () => {
    const { getByText } = render(<Component />);
    await act(() => {
      fireEvent.click(getByText('Next'));
    });
    expect(storage.value).toEqual(JSON.stringify({ page: 2 }));
    expect(getByText('page=2')).toBeInTheDocument();
    expect(getByText('sort=-date')).toBeInTheDocument();
  });
});
describe('persistState() plugin error', () => {
  // define store before each test
  let store, storage, Component;
  beforeEach(() => {
    const state = { page: 1, sort: '-date' };
    const actions = {
      setPage: page => store.mergeState({ page }),
      setSort: sort => store.mergeState({ sort }),
    };
    store = new Store({
      state,
      actions,
    });
    storage = {
      value: undefined,
      getItem: jest.fn(id => storage.value),
      setItem: jest.fn((id, val) => (storage.value = val)),
    };
    Component = () => {
      const state = useStoreState(store);
      const { setPage } = store.actions;
      return (
        <div className="Pagination">
          <span>page={state.page}</span>
          <span>sort={state.sort}</span>
          <span onClick={() => setPage(state.page + 1)}>Next</span>
        </div>
      );
    };
  });
  it('should throw on strings', () => {
    const store = new Store({});
    const shouldThrow = () => {
      store.plugin(persistState({ storage: 'foo' }));
    };
    expect(shouldThrow).toThrowError();
  });
  it('should throw on null', () => {
    const store = new Store({});
    const shouldThrow = () => {
      store.plugin(persistState(null));
    };
    expect(shouldThrow).toThrowError();
  });
  it('should throw on empty objects', () => {
    const store = new Store({ storage: {} });
    const shouldThrow = () => {
      store.plugin(persistState({}));
    };
    expect(shouldThrow).toThrowError();
  });
  it('should throw on non-array fields', () => {
    const storage = {
      value: undefined,
      getItem: jest.fn(id => storage.value),
      setItem: jest.fn((id, val) => (storage.value = val)),
    };
    const store = new Store({});
    const shouldThrow = () => {
      store.plugin(persistState({ storage, fields: 'foo' }));
    };
    expect(shouldThrow).toThrowError();
  });
});
describe('persistState() JSON errors', () => {
  // define store before each test
  let spy, store, storage, Component;
  beforeEach(() => {
    spy = jest.spyOn(console, 'error');
    spy.mockImplementation(() => {});
    const state = { page: 1, sort: '-date' };
    store = new Store({
      state,
    });
    storage = {
      value: null,
      getItem: jest.fn(id => storage.value),
      setItem: jest.fn((id, val) => (storage.value = val)),
    };
    Component = () => {
      const state = useStoreState(store);
      return (
        <div className="Pagination">
          <span>page={state.page}</span>
          <span>sort={state.sort}</span>
        </div>
      );
    };
  });
  afterEach(() => {
    spy.mockRestore();
  });
  it('should error on invalid JSON', () => {
    store.plugin(persistState({ storage, key: 'hello' }));
    storage.value = '{"a",1';
    render(<Component />);
    expect(spy.mock.calls[0][0]).toContain('react-thermals');
    expect(spy.mock.calls[0][0]).toContain('parse');
    expect(store.getState()).toEqual({ page: 1, sort: '-date' });
    expect(storage.setItem.mock.calls).toEqual([
      ['hello', JSON.stringify({ page: 1, sort: '-date' })],
    ]);
  });
  it('should error on invalid JSON', () => {
    store.plugin(persistState({ storage, key: 'hi', fields: ['page'] }));
    storage.value = '{"page",3';
    render(<Component />);
    expect(spy.mock.calls[0][0]).toContain('react-thermals');
    expect(spy.mock.calls[0][0]).toContain('parse');
    expect(store.getState()).toEqual({ page: 1, sort: '-date' });
    expect(storage.setItem.mock.calls).toEqual([
      ['hi', JSON.stringify({ page: 1 })],
    ]);
  });
  it('should not error on non-object JSON', () => {
    storage.value = '5';
    render(<Component />);
    expect(spy).not.toHaveBeenCalled();
  });
  it('should error on JSON.stringify error', () => {
    const cyclic = { a: 1 };
    cyclic.self = cyclic;
    store.setSync(cyclic);
    store.plugin(persistState({ storage, key: 'food' }));
    render(<Component />);
    expect(spy.mock.calls[0][0]).toContain('react-thermals');
    expect(spy.mock.calls[0][0]).toContain('stringify');
    expect(store.getState()).toBe(cyclic);
    expect(storage.setItem.mock.calls).toEqual([['food', '']]);
  });
});
describe('persistState() with custom parse and stringify', () => {
  // define store before each test
  let store, storage, Component, parse, stringify;
  beforeEach(() => {
    const state = { page: 1, sort: '-date' };
    store = new Store({
      state,
    });
    storage = {
      value: null,
      getItem: jest.fn(id => storage.value),
      setItem: jest.fn((id, val) => (storage.value = val)),
    };
    parse = query => {
      return Object.fromEntries(new URLSearchParams(query).entries());
    };
    stringify = value => {
      return new URLSearchParams(value).toString();
    };
    store.plugin(persistState({ storage, parse, stringify, key: 'params' }));
    Component = () => {
      const state = useStoreState(store);
      return (
        <div className="Pagination">
          <span>page={state.page}</span>
          <span>sort={state.sort}</span>
        </div>
      );
    };
  });
  it('should use custom functions', () => {
    storage.value = 'page=2&sort=-date';
    render(<Component />);
    expect(store.getState()).toEqual({ page: '2', sort: '-date' });
    expect(storage.setItem.mock.calls).toEqual([
      ['params', 'page=2&sort=-date'],
    ]);
  });
});
