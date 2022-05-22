import createStore from '../../src/createStore/createStore.js';
import observable from './observable.js';

describe('observable()', () => {
  let store;
  beforeEach(() => {
    store = createStore({
      state: 0,
      actions: {
        increment() {
          store.setState(old => old + 1);
        },
        decrement() {
          store.setState(old => old - 1);
        },
      },
    });
  });
  it('should fire next', async () => {
    const observer = { next: jest.fn() };
    store.plugin(observable());
    store.subscribe(observer);
    store.actions.increment();
    await store.nextState();
    expect(store.getState()).toBe(1);
    expect(observer.next).toHaveBeenCalledWith(1);
  });
});
