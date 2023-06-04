import Store from '../../classes/Store/Store';
import mapper from './mapper';

describe('mapper(mapFn)', () => {
  it('should map values', async () => {
    const store = new Store({ ints: [5, 10, 15] });
    const doubleEach = store.connect(
      'ints',
      mapper(n => n * 2)
    );
    doubleEach();
    const finalState = await store.nextState();
    expect(finalState).toEqual({ ints: [10, 20, 30] });
  });
});
