import { vitest } from 'vitest';
import { fetcher } from './fetcher';
import Store from '../../classes/Store/Store';

const testData = [
  { id: 1, name: 'Josh' },
  { id: 2, name: 'Jim' },
];

// @ts-expect-error
globalThis.fetch = vitest.fn((url, init) => {
  if (url === '/api/users') {
    if (init && init.method === 'POST') {
      return Promise.resolve({
        status: 200,
        ok: true,
        json: () =>
          // @ts-expect-error
          Promise.resolve({ id: 3, name: JSON.parse(init.body).name }),
      });
    }
    return Promise.resolve({
      status: 200,
      ok: true,
      json: () => Promise.resolve(testData),
    });
  }
  if (url === '/api/users/2') {
    return Promise.resolve({
      status: 200,
      ok: true,
      json: () => Promise.resolve(testData[1]),
    });
  }
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
  it('should accept dynamic URL', async () => {
    const store = new Store({ user: null });
    const loadUserById = store.connect(
      'user',
      fetcher(id => `/api/users/${id}`)
    );
    await loadUserById(2);
    const finalState = await store.nextState();
    expect(finalState).toEqual({
      user: { id: 2, name: 'Jim' },
    });
  });
  it('should accept dynamic init', async () => {
    const store = new Store({ newUser: null });
    const createUser = store.connect(
      'newUser',
      fetcher('/api/users', name => ({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      }))
    );
    await createUser('Brad');
    const finalState = await store.nextState();
    expect(finalState).toEqual({ newUser: { id: 3, name: 'Brad' } });
  });
});
