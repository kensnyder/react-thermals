import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import persistState from './persistState.js';
import createStore from '../../src/createStore/createStore.js';
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
    store = createStore({
      state,
      actions,
      id: 'myStore',
    });
    storage = {
      value: null,
      getItem: jest.fn(id => storage.value),
      setItem: jest.fn((id, val) => (storage.value = val)),
    };
    store.plugin(persistState(storage));
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
    storage.value = { page: 2, sort: '-date' };
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
    expect(storage.value).toEqual({ page: 2, sort: '-date' });
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
    store = createStore({
      state,
      actions,
      id: 'myStore',
    });
    storage = {
      value: null,
      getItem: jest.fn(id => storage.value),
      setItem: jest.fn((id, val) => (storage.value = val)),
    };
    store.plugin(persistState(storage));
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
    const store = createStore({});
    const shouldThrow = () => {
      store.plugin(persistState('foo'));
    };
    expect(shouldThrow).toThrowError();
  });
  it('should throw on null', () => {
    const store = createStore({});
    const shouldThrow = () => {
      store.plugin(persistState(null));
    };
    expect(shouldThrow).toThrowError();
  });
  it('should throw on empty objects', () => {
    const store = createStore({});
    const shouldThrow = () => {
      store.plugin(persistState({}));
    };
    expect(shouldThrow).toThrowError();
  });
});
