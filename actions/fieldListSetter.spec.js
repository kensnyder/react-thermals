import createStore from '../src/createStore/createStore.js';
import { fieldListSetter, fieldListSetterSync } from './fieldListSetter.js';

function getTestStore(initialState) {
  return createStore({ state: initialState });
}

describe('fieldListSetter(propNames)', () => {
  it('should set scalar value', async () => {
    const store = getTestStore({ title: 'Mr', fname: 'John', lname: 'Doe' });
    const updateName = fieldListSetter('@', ['fname', 'lname']).bind(store);
    updateName('Jason', 'Data');
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({
      title: 'Mr',
      fname: 'Jason',
      lname: 'Data',
    });
  });
});
describe('fieldListSetterSync(propNames)', () => {
  it('should set scalar value', () => {
    const store = getTestStore({
      title: 'Mr',
      fname: 'John',
      lname: 'Doe',
    });
    const updateName = fieldListSetterSync('@', ['fname', 'lname']).bind(store);
    updateName('Jason', 'Data');
    expect(store.getState()).toEqual({
      title: 'Mr',
      fname: 'Jason',
      lname: 'Data',
    });
  });
});
