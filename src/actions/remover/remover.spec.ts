import Store from '../../classes/Store/Store';
import { remover, removerSync } from './remover';

function getTestStore(initialState) {
  return new Store({ state: initialState });
}

describe('remover(propName)', () => {
  it('should remove one or more args', async () => {
    const store = getTestStore({ ids: [1, 2, 3, 4] });
    const removeId = remover('ids').bind(store);
    removeId(2);
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ ids: [1, 3, 4] });
    removeId(3, 4);
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ ids: [1] });
  });
  it('should remove one or more args in path', async () => {
    const store = getTestStore({ ids: [[1, 2, 3, 4]] });
    const removeId = remover('ids[0]').bind(store);
    removeId(2);
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ ids: [[1, 3, 4]] });
    removeId(3, 4);
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ ids: [[1]] });
  });
  it('should change nothing if target is not an array', async () => {
    const store = getTestStore({ ids: null });
    const removeId = remover('ids').bind(store);
    removeId(1);
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ ids: null });
  });
});
describe('removerSync(propName)', () => {
  it('should remove one or more args', () => {
    const store = getTestStore({ ids: [1, 2, 3, 4] });
    const removeId = removerSync('ids').bind(store);
    removeId(2);
    expect(store.getState()).toEqual({ ids: [1, 3, 4] });
    removeId(3, 4);
    expect(store.getState()).toEqual({ ids: [1] });
  });
});
