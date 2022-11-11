import { vitest, Mock, SpyInstance } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React, { FunctionComponent } from 'react';
import Store from '../../Store/Store';
import useStoreState from '../../useStoreState/useStoreState';
import syncUrl from './syncUrl';
import '../../mocks/mock-location';
import '../../mocks/mock-history';

describe('syncUrl()', () => {
  // define store before each test
  let store: Store;
  let Component: FunctionComponent;
  beforeEach(() => {
    document.title = 'My Page';
    location.search = '';
    const state = { page: 1, sort: '-date' };
    const actions = {
      setPage: (page: number) => store.mergeState({ page }),
      setSort: (sort: string) => store.mergeState({ sort }),
    };
    store = new Store({
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
          <span onClick={() => setPage(state.page + 1)}>Next</span>
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
    expect((history.replaceState as Mock).mock.lastCall).toEqual([
      {},
      'My Page',
      '?page=1&sort=-date',
    ]);
  });
  it('should handle no initial state with existing location.search', () => {
    location.search = '?answer=42';
    store.plugin(syncUrl({ fields: ['page', 'sort'] }));
    const { getByText } = render(<Component />);
    expect(getByText('page=1')).toBeInTheDocument();
    expect(getByText('sort=-date')).toBeInTheDocument();
    expect(getByText('foo=')).toBeInTheDocument();
    expect((history.replaceState as Mock).mock.lastCall).toEqual([
      {},
      'My Page',
      '?answer=42&page=1&sort=-date',
    ]);
  });
  it('should override initial state', () => {
    location.search = '?page=2&sort=-modified&foo=bar';
    store.plugin(syncUrl({ fields: ['page', 'sort'] }));
    const { getByText } = render(<Component />);
    expect(getByText('page=2')).toBeInTheDocument();
    expect(getByText('sort=-modified')).toBeInTheDocument();
    expect(getByText('foo=')).toBeInTheDocument();
    expect(store.getState()).toEqual({ page: '2', sort: '-modified' });
  });
  it('should write changes to url', async () => {
    document.title = 'My Page';
    location.search = '?page=2&sort=-modified&foo=bar';
    store.plugin(
      syncUrl({
        schema: { page: 'number', sort: 'string' },
      })
    );
    const { getByText, unmount } = render(<Component />);
    await act(() => {
      fireEvent.click(getByText('Next'));
      store.flushSync();
    });
    expect(getByText('page=3')).toBeInTheDocument();
    expect(getByText('sort=-modified')).toBeInTheDocument();
    expect(getByText('foo=')).toBeInTheDocument();
    expect((history.pushState as Mock).mock.lastCall).toEqual([
      {},
      'My Page',
      '?foo=bar&page=3&sort=-modified',
    ]);
    await act(unmount);
    expect((history.pushState as Mock).mock.lastCall).toEqual([
      {},
      'My Page',
      '?foo=bar',
    ]);
  });
  it('should replace history', async () => {
    location.search = '?page=20&sort=-modified&foo=baz';
    store.plugin(
      syncUrl({
        schema: { page: 'number', sort: 'string' },
        replace: true,
      })
    );
    const { getByText } = render(<Component />);
    await act(() => {
      fireEvent.click(getByText('Next'));
      store.flushSync();
    });
    expect(getByText('page=21')).toBeInTheDocument();
    expect(getByText('sort=-modified')).toBeInTheDocument();
    expect(getByText('foo=')).toBeInTheDocument();
    expect((history.replaceState as Mock).mock.lastCall).toEqual([
      {},
      'My Page',
      '?foo=baz&page=21&sort=-modified',
    ]);
  });
  it('should cast from schema number', async () => {
    store.setSync({ rating: 16, food: 'fruit' });
    location.search = '?rating=17';
    store.plugin(syncUrl({ schema: { rating: 'number' } }));
    render(<Component />);
    expect(store.getState()).toEqual({ rating: 17, food: 'fruit' });
  });
  it('should cast from schema number[]', async () => {
    store.setSync({ ids: [1, 2] });
    location.search = '?ids=3,4';
    store.plugin(syncUrl({ schema: { ids: 'number[]' } }));
    render(<Component />);
    expect(store.getState()).toEqual({ ids: [3, 4] });
  });
  it('should cast from schema string', async () => {
    store.setSync({ hello: 'world' });
    location.search = '?hello=there';
    store.plugin(syncUrl({ schema: { hello: 'string' } }));
    render(<Component />);
    expect(store.getState()).toEqual({ hello: 'there' });
  });
  it('should cast from schema string[]', async () => {
    store.setSync({ letters: ['a', 'b'] });
    location.search = '?letters=d,e';
    store.plugin(syncUrl({ schema: { letters: 'string[]' } }));
    render(<Component />);
    expect(store.getState()).toEqual({ letters: ['d', 'e'] });
  });
  it('should cast from schema boolean', async () => {
    store.setSync({ isValid: false });
    location.search = '?isValid=true';
    store.plugin(syncUrl({ schema: { isValid: 'boolean' } }));
    render(<Component />);
    expect(store.getState()).toEqual({ isValid: true });
  });
  it('should cast from schema boolean[]', async () => {
    store.setSync({ flags: [false, false] });
    location.search = '?flags=true,false';
    store.plugin(syncUrl({ schema: { flags: 'boolean[]' } }));
    render(<Component />);
    expect(store.getState()).toEqual({ flags: [true, false] });
  });
  it('should cast from schema Date', async () => {
    store.setSync({ start: '2022-05-23' });
    location.search = '?start=2022-05-24';
    store.plugin(syncUrl({ schema: { start: 'Date' } }));
    render(<Component />);
    expect(store.getState().start).toBeInstanceOf(Date);
    expect(store.getState().start.toJSON()).toBe('2022-05-24T00:00:00.000Z');
  });
  it('should cast from schema Date[]', async () => {
    store.setSync({ range: ['2022-05-20', '2022-05-21'] });
    location.search = '?range=2022-05-23,2022-05-24';
    store.plugin(syncUrl({ schema: { range: 'Date[]' } }));
    render(<Component />);
    expect(store.getState().range[0]).toBeInstanceOf(Date);
    expect(store.getState().range[1]).toBeInstanceOf(Date);
    expect(JSON.stringify(store.getState().range)).toBe(
      '["2022-05-23T00:00:00.000Z","2022-05-24T00:00:00.000Z"]'
    );
  });
  it('should throw when casting unknown type', async () => {
    const spy: SpyInstance = vitest.spyOn(console, 'error');
    spy.mockImplementation(() => {});
    // @ts-ignore
    store.plugin(syncUrl({ schema: { age: 'NOT_A_THING' } }));
    store.setSync({ age: 14 });
    location.search = '?age=15';
    render(<Component />);
    // @ts-ignore
    expect(String(spy.mock.lastCall[0])).toContain(
      'unknown schema type "NOT_A_THING"'
    );
    spy.mockRestore();
  });
});
describe('syncUrl() error', () => {
  it('should throw when both fields and schema are given', async () => {
    const store = new Store({});
    const toThrow = () => {
      store.plugin(
        syncUrl({
          fields: ['hi'],
          schema: { hi: 'string' },
        })
      );
    };
    expect(toThrow).toThrowError(/react-thermals/);
  });
  it('should throw when neither fields nor schema are given', async () => {
    const store = new Store({});
    const toThrow = () => {
      store.plugin(syncUrl());
    };
    expect(toThrow).toThrowError(/react-thermals/);
  });
});
