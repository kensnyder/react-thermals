import Store from '../../classes/Store/Store';
import { mapper, mapperSync } from './mapper';

function getTestStore(initialState) {
  return new Store({ state: initialState });
}

describe('mapper(propName)', () => {
  it('should map values', async () => {
    const store = getTestStore({ ints: [5, 10, 15] });
    const mapInts = mapper('ints').bind(store);
    mapInts(n => n * 2);
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ ints: [10, 20, 30] });
  });
  it('should map values in path', async () => {
    const store = getTestStore([
      { ints: [5, 10, 15] },
      { strs: ['five', 'ten', 'fifteen'] },
    ]);
    const mapInts = mapper('@[0]ints').bind(store);
    mapInts(n => n * 2);
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual([
      { ints: [10, 20, 30] },
      { strs: ['five', 'ten', 'fifteen'] },
    ]);
  });
});
describe('fieldMapperSync(propName)', () => {
  it('should map values', () => {
    const store = getTestStore({ ints: [5, 10, 15] });
    const mapInts = mapperSync('ints').bind(store);
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
    const mapUsers = mapperSync('users').bind(store);
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
