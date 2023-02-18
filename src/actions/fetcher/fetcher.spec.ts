import { vitest } from 'vitest';
import { fetcher, jsonFetcher } from './fetcher';
import Store from '../../classes/Store/Store';

// @ts-ignore
globalThis.fetch = vitest.fn(() => {
  return Promise.resolve({
    status: 200,
    ok: true,
    json: () =>
      Promise.resolve([
        { id: 1, name: 'Josh' },
        { id: 2, name: 'Jim' },
      ]),
  });
});

describe('fetcher()', () => {
  it('should call an extractor', async () => {
    const store = new Store({ users: null });
    const loadUsers = store.connect(
      fetcher({
        path: 'users',
        url: 'foo',
        extractor: resp => resp.json(),
      })
    );
    await loadUsers();
    expect(store.getState()).toEqual({
      users: [
        { id: 1, name: 'Josh' },
        { id: 2, name: 'Jim' },
      ],
    });
  });
  it('should fetch at root', async () => {
    const store = new Store([]);
    const loadUsers = store.connect(
      fetcher({
        url: 'foo',
        extractor: resp => resp.json(),
      })
    );
    await loadUsers();
    expect(store.getState()).toEqual([
      { id: 1, name: 'Josh' },
      { id: 2, name: 'Jim' },
    ]);
  });
});
describe('jsonFetcher()', () => {
  it('should call a transformer', async () => {
    const store = new Store({ users: null });
    const loadUserNames = store.connect(
      jsonFetcher({
        path: 'users',
        url: 'foo',
        transformer: users => users.map(u => u.name),
      })
    );
    await loadUserNames();
    expect(store.getState()).toEqual({
      users: ['Josh', 'Jim'],
    });
  });
  it('should use a default transformer', async () => {
    const store = new Store({ users: null });
    const loadUserNames = store.connect(
      jsonFetcher({
        path: 'users',
        url: 'foo',
      })
    );
    await loadUserNames();
    expect(store.getState()).toEqual({
      users: [
        { id: 1, name: 'Josh' },
        { id: 2, name: 'Jim' },
      ],
    });
  });
  it('should fetch at root', async () => {
    const store = new Store({ users: null });
    const loadUsers = store.connect(
      jsonFetcher({
        url: 'foo',
      })
    );
    await loadUsers();
    expect(store.getState()).toEqual([
      { id: 1, name: 'Josh' },
      { id: 2, name: 'Jim' },
    ]);
  });
});
