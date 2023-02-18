import { vitest, Mock, SpyInstance } from 'vitest';
import React, { FunctionComponent } from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Store from '../../classes/Store/Store';
import persistState from './persistState';
import useStoreState from '../../hooks/useStoreState/useStoreState';
import { ParseType, StringifyType } from './parseAndStringify';

interface StorageMock extends Storage {
  value: any;
  getItem: Mock;
  setItem: Mock;
}

describe('persistState()', () => {
  // define store before each test
  let store: Store;
  let storage: StorageMock;
  let Component: FunctionComponent;
  beforeEach(() => {
    const state = { page: 1, sort: '-date' };
    store = new Store(state, {
      id: 'myStore',
    });
    const setPage = page => store.mergeState({ page });
    storage = {
      value: undefined,
      getItem: vitest.fn(() => storage.value),
      setItem: vitest.fn((id, val) => (storage.value = val)),
      removeItem: vitest.fn(),
      clear: vitest.fn(),
      key: vitest.fn(),
      length: 0,
    };
    store.plugin(persistState({ key: 'foo', path: '@', storage }));
    Component = () => {
      const state = useStoreState(store);
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
    expect(storage.getItem).toHaveBeenCalledWith('foo');
  });
  it('should override initial state', () => {
    storage.value = JSON.stringify({ page: 2, sort: '-date' });
    const { getByText } = render(<Component />);
    expect(getByText('page=2')).toBeInTheDocument();
    expect(getByText('sort=-date')).toBeInTheDocument();
    expect(storage.getItem).toHaveBeenCalledWith('foo');
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
describe('persistState() at path', () => {
  // define store before each test
  let store: Store;
  let storage: StorageMock;
  let Component: FunctionComponent;
  beforeEach(() => {
    const state = { search: { page: 1, sort: '-date' } };
    store = new Store(state);
    const setPage = page => store.mergeStateAt('search', { page });
    storage = {
      value: undefined,
      getItem: vitest.fn(() => storage.value),
      setItem: vitest.fn((id, val) => (storage.value = val)),
      removeItem: vitest.fn(),
      clear: vitest.fn(),
      key: vitest.fn(),
      length: 0,
    };
    store.plugin(
      persistState({
        storage,
        key: 'myKey',
        path: 'search.page',
      })
    );
    Component = () => {
      const state = useStoreState(store);
      return (
        <div className="Pagination">
          <span>page={state.search.page}</span>
          <span>sort={state.search.sort}</span>
          <span onClick={() => setPage(state.search.page + 1)}>Next</span>
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
    storage.value = JSON.stringify(5);
    const { getByText } = render(<Component />);
    expect(getByText('page=5')).toBeInTheDocument();
    expect(storage.getItem).toHaveBeenCalledWith('myKey');
  });
  it('should save state', async () => {
    const { getByText } = render(<Component />);
    await act(() => {
      fireEvent.click(getByText('Next'));
    });
    expect(storage.value).toEqual(JSON.stringify(2));
    expect(getByText('page=2')).toBeInTheDocument();
  });
});
describe('persistState() that defaults id', () => {
  // define store before each test
  let store: Store;
  let storage: StorageMock;
  let Component: FunctionComponent;
  beforeEach(() => {
    const state = { search: { page: 1, sort: '-date' } };
    store = new Store(state, { id: 'myStore' });
    const setPage = page => store.mergeStateAt('search', { page });
    storage = {
      value: undefined,
      getItem: vitest.fn(() => storage.value),
      setItem: vitest.fn((id, val) => (storage.value = val)),
      removeItem: vitest.fn(),
      clear: vitest.fn(),
      key: vitest.fn(),
      length: 0,
    };
    store.plugin(
      persistState({
        storage,
        path: 'search.page',
      })
    );
    Component = () => {
      const state = useStoreState(store);
      return (
        <div className="Pagination">
          <span>page={state.search.page}</span>
          <span>sort={state.search.sort}</span>
          <span onClick={() => setPage(state.search.page + 1)}>Next</span>
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
});
describe('persistState() plugin error', () => {
  it('should throw on strings', () => {
    const store = new Store({});
    const shouldThrow = () => {
      // @ts-ignore
      store.plugin(persistState({ storage: 'foo' }));
    };
    expect(shouldThrow).toThrowError();
  });
  it('should throw on null', () => {
    const store = new Store({});
    const shouldThrow = () => {
      // @ts-ignore
      store.plugin(persistState(null));
    };
    expect(shouldThrow).toThrowError();
  });
  it('should throw on empty objects', () => {
    // @ts-ignore
    const store = new Store({});
    const shouldThrow = () => {
      // @ts-ignore
      store.plugin(persistState({ storage: {} }));
    };
    expect(shouldThrow).toThrowError();
  });
});
describe('persistState() JSON errors', () => {
  // define store before each test
  let consoleSpy: SpyInstance;
  let store: Store;
  let storage: StorageMock;
  let Component: FunctionComponent;
  beforeEach(() => {
    consoleSpy = vitest.spyOn(console, 'error');
    consoleSpy.mockImplementation(() => {});
    const state = { page: 1, sort: '-date' };
    store = new Store(state);
    storage = {
      value: undefined,
      getItem: vitest.fn(() => storage.value),
      setItem: vitest.fn((id, val) => (storage.value = val)),
      removeItem: vitest.fn(),
      clear: vitest.fn(),
      key: vitest.fn(),
      length: 0,
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
    consoleSpy.mockRestore();
  });
  it('should fall back to state on invalid JSON', () => {
    store.plugin(persistState({ storage, key: 'hello' }));
    storage.value = '{"a",1';
    render(<Component />);
    expect(store.getState()).toEqual({ page: 1, sort: '-date' });
    expect(storage.getItem('hello')).toEqual(
      JSON.stringify({ page: 1, sort: '-date' })
    );
    expect(storage.setItem.mock.calls).toEqual([
      ['hello', JSON.stringify({ page: 1, sort: '-date' })],
    ]);
  });
  it('should warn on invalid JSON', () => {
    store.plugin(persistState({ storage, key: 'hi', path: 'foo' }));
    storage.value = '{"page",3';
    render(<Component />);
    expect(consoleSpy.mock.calls[0][0]).toContain('react-thermals');
    expect(consoleSpy.mock.calls[0][0]).toContain('parse');
  });
  it('should not error on non-object JSON', () => {
    storage.value = '5';
    render(<Component />);
    expect(consoleSpy).not.toHaveBeenCalled();
  });
  it('should error on JSON.stringify error', () => {
    const cyclic: Record<string, any> = { a: 1 };
    cyclic.self = cyclic;
    store.setState(cyclic);
    store.plugin(persistState({ storage, key: 'food' }));
    render(<Component />);
    expect(consoleSpy.mock.calls[0][0]).toContain('react-thermals');
    expect(consoleSpy.mock.calls[0][0]).toContain('stringify');
    expect(store.getState()).toBe(cyclic);
    expect(storage.setItem.mock.calls).toEqual([['food', '']]);
  });
});
describe('persistState() with custom parse and stringify', () => {
  // define store before each test
  let store: Store;
  let storage: StorageMock;
  let Component: FunctionComponent;
  let parse: ParseType;
  let stringify: StringifyType;
  beforeEach(() => {
    const state = { page: 1, sort: '-date' };
    store = new Store(state);
    storage = {
      value: undefined,
      getItem: vitest.fn(() => storage.value),
      setItem: vitest.fn((id, val) => (storage.value = val)),
      removeItem: vitest.fn(),
      clear: vitest.fn(),
      key: vitest.fn(),
      length: 0,
    };
    parse = (query: string): any => {
      return Object.fromEntries(new URLSearchParams(query).entries());
    };
    stringify = (value: any): string => {
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
    expect(storage.setItem.mock.lastCall).toEqual([
      'params',
      'page=2&sort=-date',
    ]);
  });
});
