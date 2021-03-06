import createStore from '../src/createStore/createStore.js';
import { fieldMapper, fieldMapperSync } from './fieldMapper.js';

function getTestStore(initialState) {
  return createStore({ state: initialState });
}

describe('fieldMapper(propName)', () => {
  it('should map values', async () => {
    const store = getTestStore({ ints: [5, 10, 15] });
    const mapInts = fieldMapper('ints').bind(store);
    mapInts(n => n * 2);
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ ints: [10, 20, 30] });
  });
});
describe('fieldMapperSync(propName)', () => {
  it('should map values', () => {
    const store = getTestStore({ ints: [5, 10, 15] });
    const mapInts = fieldMapperSync('ints').bind(store);
    mapInts(n => n * 2);
    expect(store.getState()).toEqual({ ints: [10, 20, 30] });
  });
  it('should map objects', () => {
    const store = getTestStore({
      users: [
        { name: 'Joe Shmoe', isActive: true },
        { name: 'Jane Pain', isActive: false },
        { name: 'Peter Pan', isActive: true },
      ],
    });
    const mapUsers = fieldMapperSync('users').bind(store);
    mapUsers(user => ({ ...user, isActive: false }));
    expect(store.getState()).toEqual({
      users: [
        { name: 'Joe Shmoe', isActive: false },
        { name: 'Jane Pain', isActive: false },
        { name: 'Peter Pan', isActive: false },
      ],
    });
  });
});
