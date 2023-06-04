import Store from '../../classes/Store/Store';
import adder from './adder';

describe('adder(propName, amount)', () => {
  it('should increment', async () => {
    const store = new Store({ likes: 0, mode: 'view' });
    const like = store.connect('likes', adder(1));
    const dislike = store.connect('likes', adder(-1));
    like();
    await store.nextState();
    expect(store.getState()).toEqual({ likes: 1, mode: 'view' });
    dislike();
    await store.nextState();
    expect(store.getState()).toEqual({ likes: 0, mode: 'view' });
  });
  it('should allow passing addend', async () => {
    const store = new Store({ cart: { total: 42 } });
    const addToTotal = store.connect('cart.total', adder());
    addToTotal(2);
    await store.nextState();
    expect(store.getState()).toEqual({ cart: { total: 44 } });
  });
  it('should allow paths with asterisk', async () => {
    const store = new Store({ items: [{ price: 42 }, { price: 47 }] });
    const addDeliveryFee = store.connect('items.*.price', adder());
    addDeliveryFee(2);
    await store.nextState();
    expect(store.getState()).toEqual({ items: [{ price: 44 }, { price: 49 }] });
  });
});
