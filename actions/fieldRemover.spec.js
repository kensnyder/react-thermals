import createStore from '../src/createStore/createStore.js';
import { fieldRemover, fieldRemoverSync } from './fieldRemover.js';

function getTestStore(initialState) {
  return createStore({ state: initialState });
}

describe('fieldRemover(propName)', () => {
  it('should remove one or more args', async () => {
    const store = getTestStore({ ids: [1, 2, 3, 4] });
    const removeId = fieldRemover('ids').bind(store);
    removeId(2);
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ ids: [1, 3, 4] });
    removeId(3, 4);
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ ids: [1] });
  });
});
describe('fieldRemoverSync(propName)', () => {
  it('should remove one or more args', () => {
    const store = getTestStore({ ids: [1, 2, 3, 4] });
    const removeId = fieldRemoverSync('ids').bind(store);
    removeId(2);
    expect(store.getState()).toEqual({ ids: [1, 3, 4] });
    removeId(3, 4);
    expect(store.getState()).toEqual({ ids: [1] });
  });
});
