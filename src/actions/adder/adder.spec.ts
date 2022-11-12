import Store from '../../class/Store/Store';
import { adder, adderSync } from './adder';

function getTestStore(initialState) {
  return new Store({ state: initialState });
}

describe('adder(propName, amount)', () => {
  it('should increment', async () => {
    const store = getTestStore({ likes: 0, mode: 'view' });
    const like = adder('likes', 1).bind(store);
    const dislike = adder('likes', -1).bind(store);
    like();
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ likes: 1, mode: 'view' });
    dislike();
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ likes: 0, mode: 'view' });
  });
  it('should increment with multipath', async () => {
    const store = getTestStore({ post: { likes: 0, mode: 'view' } });
    const like = adder('post.likes', 1).bind(store);
    const dislike = adder('post.likes', -1).bind(store);
    like();
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ post: { likes: 1, mode: 'view' } });
    dislike();
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ post: { likes: 0, mode: 'view' } });
  });
  it('should allow passing addend', async () => {
    const store = getTestStore({ cart: { total: 42 } });
    const addToTotal = adder('cart.total').bind(store);
    addToTotal(2);
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ cart: { total: 44 } });
  });
});
describe('fieldAdderSync(propName, amount)', () => {
  it('should increment', () => {
    const store = getTestStore({ likes: 0, mode: 'view' });
    const like = adderSync('likes', 1).bind(store);
    const dislike = adderSync('likes', -1).bind(store);
    like();
    expect(store.getState()).toEqual({ likes: 1, mode: 'view' });
    dislike();
    expect(store.getState()).toEqual({ likes: 0, mode: 'view' });
  });
});
