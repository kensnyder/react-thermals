import Store from '../../classes/Store/Store';
import toggler from './toggler';

describe('toggler()', () => {
  it('should set scalar value', async () => {
    const store = new Store({ door: 'A', open: false });
    const toggleDoor = store.connect('open', toggler());
    toggleDoor();
    await store.nextState();
    expect(store.getState()).toEqual({ door: 'A', open: true });
    // toggle back to closed
    toggleDoor();
    await store.nextState();
    expect(store.getState()).toEqual({ door: 'A', open: false });
  });
});
