import Store from '../../classes/Store/Store';
import toggler from './toggler';

describe('toggler(propName)', () => {
  it('should set scalar value', async () => {
    const store = new Store({ door: 'A', open: false });
    const toggleDoor = toggler('open').bind(store);
    toggleDoor();
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ door: 'A', open: true });
    toggleDoor();
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ door: 'A', open: false });
  });
});
