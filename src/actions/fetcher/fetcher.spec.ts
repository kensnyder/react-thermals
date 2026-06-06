import { afterAll, beforeAll, describe, expect, it, mock, spyOn } from 'bun:test';
import Store from '../../classes/Store/Store';
import { fetcher } from './fetcher';

const testData = [
  { id: 1, name: 'Josh' },
  { id: 2, name: 'Jim' },
];

function mockFetch(url: string, init?: RequestInit): Promise<Response> {
  if (url === '/api/users') {
    if (init?.method === 'POST') {
      const body = JSON.parse(init.body as string);
      return Promise.resolve(new Response(JSON.stringify({ id: 3, name: body.name })));
    }
    return Promise.resolve(new Response(JSON.stringify(testData)));
  }
  if (url === '/api/users/2') {
    return Promise.resolve(new Response(JSON.stringify(testData[1])));
  }
  return Promise.reject(new Error(`Unexpected fetch: ${url}`));
}

beforeAll(() => {
  spyOn(globalThis, 'fetch').mockImplementation(mockFetch as unknown as typeof fetch);
});

afterAll(() => {
  mock.restore();
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
