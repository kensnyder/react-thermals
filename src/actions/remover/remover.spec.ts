import Store from '../../classes/Store/Store';
import remover from './remover';

describe('remover(propName)', () => {
  it('should remove one or more args', async () => {
    const store = new Store({ ids: [1, 2, 3, 4] });
    const removeId = store.connect('ids', remover());
    removeId(2);
    const next = await store.nextState();
    expect(next).toEqual({ ids: [1, 3, 4] });
    removeId(3, 4);
    const final = await store.nextState();
    expect(final).toEqual({ ids: [1] });
  });
  it('should support paths', async () => {
    const store = new Store({ cart: { ids: [1, 2, 3, 4] } });
    const removeItem = store.connect('cart.ids', remover());
    removeItem(2);
    const next = await store.nextState();
    expect(next).toEqual({ cart: { ids: [1, 3, 4] } });
  });
  it('should change nothing if target is not an array', async () => {
    const store = new Store({ ids: [1, 2, 3, 4] });
    const removeId = store.connect('ids', remover());
    removeId(99);
    const next = await store.nextState();
    expect(next).toEqual({ ids: [1, 2, 3, 4] });
  });
  it('should change nothing if target is falsy', async () => {
    const store = new Store({ ids: null });
    const removeId = store.connect('ids', remover());
    removeId(99);
    const next = await store.nextState();
    expect(next).toEqual({ ids: null });
  });
});
