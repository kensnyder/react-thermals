import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import createStore from '../../src/createStore/createStore.js';
import useStoreState from '../../src/useStoreState/useStoreState.js';
import syncUrl from './syncUrl.js';

describe('syncUrl()', () => {
  // define store before each test
  let store, Component;
  beforeEach(() => {
    document.title = 'My Page';
    const state = { page: 1, sort: '-date' };
    const actions = {
      setPage: page => store.mergeState({ page }),
      setSort: sort => store.mergeState({ sort }),
    };
    store = createStore({
      state,
      actions,
    });
    Component = () => {
      const state = useStoreState(store);
      const { setPage } = store.actions;
      return (
        <div className="Pagination">
          <span>page={state.page}</span>
          <span>sort={state.sort}</span>
          <span>foo={state.foo}</span>
          <span onClick={() => setPage(Number(state.page) + 1)}>Next</span>
        </div>
      );
    };
  });
  it('should handle no initial state', () => {
    store.plugin(syncUrl({ fields: ['page', 'sort'] }));
    const { getByText } = render(<Component />);
    expect(getByText('page=1')).toBeInTheDocument();
    expect(getByText('sort=-date')).toBeInTheDocument();
    expect(getByText('foo=')).toBeInTheDocument();
    expect(window.history.replaceState.mock.calls).toEqual([
      [{}, 'My Page', '?page=1&sort=-date'],
    ]);
  });
  it('should handle no initial state with existing window.location.search', () => {
    window.location.search = '?answer=42';
    store.plugin(syncUrl({ fields: ['page', 'sort'] }));
    const { getByText } = render(<Component />);
    expect(getByText('page=1')).toBeInTheDocument();
    expect(getByText('sort=-date')).toBeInTheDocument();
    expect(getByText('foo=')).toBeInTheDocument();
    expect(window.history.replaceState.mock.calls).toEqual([
      [{}, 'My Page', '?answer=42&page=1&sort=-date'],
    ]);
  });
  it('should override initial state', () => {
    window.location.search = '?page=2&sort=-modified&foo=bar';
    store.plugin(syncUrl({ fields: ['page', 'sort'] }));
    const { getByText } = render(<Component />);
    expect(getByText('page=2')).toBeInTheDocument();
    expect(getByText('sort=-modified')).toBeInTheDocument();
    expect(getByText('foo=')).toBeInTheDocument();
    expect(store.getState()).toEqual({ page: '2', sort: '-modified' });
  });
  it('should write changes to url', async () => {
    document.title = 'My Page';
    window.location.search = '?page=2&sort=-modified&foo=bar';
    store.plugin(syncUrl({ fields: ['page', 'sort'] }));
    const { getByText } = render(<Component />);
    await act(() => {
      fireEvent.click(getByText('Next'));
    });
    expect(getByText('page=3')).toBeInTheDocument();
    expect(getByText('sort=-modified')).toBeInTheDocument();
    expect(getByText('foo=')).toBeInTheDocument();
    expect(window.history.pushState.mock.calls).toEqual([
      [{}, 'My Page', '?foo=bar&page=3&sort=-modified'],
    ]);
  });
  it('should replace history', async () => {
    window.location.search = '?page=20&sort=-modified&foo=baz';
    store.plugin(syncUrl({ fields: ['page', 'sort'], replace: true }));
    const { getByText } = render(<Component />);
    await act(() => {
      fireEvent.click(getByText('Next'));
    });
    expect(getByText('page=21')).toBeInTheDocument();
    expect(getByText('sort=-modified')).toBeInTheDocument();
    expect(getByText('foo=')).toBeInTheDocument();
    expect(window.history.replaceState.mock.calls[1]).toEqual([
      {},
      'My Page',
      '?foo=baz&page=21&sort=-modified',
    ]);
  });
  it('should cast from schema number', async () => {
    store.setSync({ rating: 16 });
    window.location.search = '?rating=17';
    store.plugin(syncUrl({ schema: { rating: 'number' } }));
    render(<Component />);
    expect(store.getState()).toEqual({ rating: 17 });
  });
  it('should cast from schema number[]', async () => {
    store.setSync({ ids: [1, 2] });
    window.location.search = '?ids=3,4';
    store.plugin(syncUrl({ schema: { ids: 'number[]' } }));
    render(<Component />);
    expect(store.getState()).toEqual({ ids: [3, 4] });
  });
  it('should cast from schema string', async () => {
    store.setSync({ hello: 'world' });
    window.location.search = '?hello=there';
    store.plugin(syncUrl({ schema: { hello: 'string' } }));
    render(<Component />);
    expect(store.getState()).toEqual({ hello: 'there' });
  });
  it('should cast from schema string[]', async () => {
    store.setSync({ letters: ['a', 'b'] });
    window.location.search = '?letters=d,e';
    store.plugin(syncUrl({ schema: { letters: 'string[]' } }));
    render(<Component />);
    expect(store.getState()).toEqual({ letters: ['d', 'e'] });
  });
});
