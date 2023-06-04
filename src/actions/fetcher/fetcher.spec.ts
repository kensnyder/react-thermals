import { vitest } from 'vitest';
import { fetcher } from './fetcher';
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
  it('should fetch items', async () => {
    const store = new Store({ users: null });
    const loadUsers = store.connect('users', fetcher('/api/users'));
    await loadUsers();
    const finalState = await store.nextState();
    expect(finalState).toEqual({
      users: [
        { id: 1, name: 'Josh' },
        { id: 2, name: 'Jim' },
      ],
    });
  });
  it('should call an extractor', async () => {
    const store = new Store({ userIds: null });
    const loadUserIds = store.connect(
      'userIds',
      fetcher('/api/users', {}, response =>
        response.json().then(users => users.map(user => user.id))
      )
    );
    await loadUserIds();
    const finalState = await store.nextState();
    expect(finalState).toEqual({
      userIds: [1, 2],
    });
  });
});
