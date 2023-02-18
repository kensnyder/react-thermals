import Store from '../../classes/Store/Store';
import remover from './remover';

describe('remover(propName)', () => {
  it('should remove one or more args', async () => {
    const store = new Store({ ids: [1, 2, 3, 4] });
    const removeId = remover('ids').bind(store);
    removeId(2);
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ ids: [1, 3, 4] });
    removeId(3, 4);
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ ids: [1] });
  });
  it('should remove one or more args in path', async () => {
    const store = new Store({ ids: [[1, 2, 3, 4]] });
    const removeId = remover('ids[0]').bind(store);
    removeId(2);
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ ids: [[1, 3, 4]] });
    removeId(3, 4);
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ ids: [[1]] });
  });
  it('should change nothing if target is not an array', async () => {
    const store = new Store({ ids: null });
    const removeId = remover('ids').bind(store);
    removeId(1);
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ ids: null });
  });
});
