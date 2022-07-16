import createStore from '../src/createStore/createStore.js';
import { fieldToggler, fieldTogglerSync } from './fieldToggler.js';

function getTestStore(initialState) {
  return createStore({ state: initialState });
}

describe('fieldToggler(propName)', () => {
  it('should set scalar value', async () => {
    const store = getTestStore({ door: 'A', open: false });
    const toggleDoor = fieldToggler('open').bind(store);
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
    const toggleDoor = fieldTogglerSync('open').bind(store);
    toggleDoor();
    expect(store.getState()).toEqual({ door: 'A', open: true });
    toggleDoor();
    expect(store.getState()).toEqual({ door: 'A', open: false });
  });
});
