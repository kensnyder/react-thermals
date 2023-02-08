import Store from '../../classes/Store/Store';
import mapper from './mapper';

describe('mapper(propName)', () => {
  it('should map values', async () => {
    const store = new Store({ ints: [5, 10, 15] });
    const mapInts = mapper('ints').bind(store);
    mapInts(n => n * 2);
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ ints: [10, 20, 30] });
  });
  it('should map values in path', async () => {
    const store = new Store([
      { ints: [5, 10, 15] },
      { strs: ['five', 'ten', 'fifteen'] },
    ]);
    const mapInts = mapper('0.ints').bind(store);
    mapInts(n => n * 2);
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual([
      { ints: [10, 20, 30] },
      { strs: ['five', 'ten', 'fifteen'] },
    ]);
  });
});
