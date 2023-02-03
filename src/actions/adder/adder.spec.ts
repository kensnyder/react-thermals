import Store from '../../classes/Store/Store';
import { adder, adderSync } from './adder';

describe('adder(propName, amount)', () => {
  it('should increment', async () => {
    const store = new Store({ likes: 0, mode: 'view' });
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
    const store = new Store({ post: { likes: 0, mode: 'view' } });
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
    const store = new Store({ cart: { total: 42 } });
    const addToTotal = adder('cart.total').bind(store);
    addToTotal(2);
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ cart: { total: 44 } });
  });
});
describe('fieldAdderSync(propName, amount)', () => {
  it('should increment', () => {
    const store = new Store({ likes: 0, mode: 'view' });
    const like = adderSync('likes', 1).bind(store);
    const dislike = adderSync('likes', -1).bind(store);
    like();
    expect(store.getState()).toEqual({ likes: 1, mode: 'view' });
    dislike();
    expect(store.getState()).toEqual({ likes: 0, mode: 'view' });
  });
});
