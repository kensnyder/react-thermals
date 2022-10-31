import Store from '../src/Store/Store.js';
import { toggler, togglerSync } from './toggler.js';

function getTestStore(initialState) {
  return new Store({ state: initialState });
}

describe('toggler(propName)', () => {
  it('should set scalar value', async () => {
    const store = getTestStore({ door: 'A', open: false });
    const toggleDoor = toggler('open').bind(store);
    toggleDoor();
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ door: 'A', open: true });
    toggleDoor();
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ door: 'A', open: false });
  });
});
describe('fieldTogglerSync(propName)', () => {
  it('should set scalar value', () => {
    const store = getTestStore({ door: 'A', open: false });
    const toggleDoor = togglerSync('open').bind(store);
    toggleDoor();
    expect(store.getState()).toEqual({ door: 'A', open: true });
    toggleDoor();
    expect(store.getState()).toEqual({ door: 'A', open: false });
  });
});
