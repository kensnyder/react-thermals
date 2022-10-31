import createStore from '../src/createStore/createStore.js';
import { replacer, replacerSync } from './replacer.js';

function getTestStore(initialState) {
  return createStore({ state: initialState });
}

describe('replacer()', () => {
  it('should update a single item with an updater', async () => {
    const todos = [
      { text: 'item 0', isComplete: true },
      { text: 'item 1', isComplete: false },
    ];
    const store = getTestStore({ todos });
    const updateTodo = replacer('todos').bind(store);
    updateTodo(todos[1], todo => ({
      ...todo,
      isComplete: true,
    }));
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState().todos).toEqual([
      { text: 'item 0', isComplete: true },
      { text: 'item 1', isComplete: true },
    ]);
  });
});
describe('replacerSync()', () => {
  it('should update a single item synchronously with an updater', () => {
    const todos = [
      { text: 'item 1', isComplete: true },
      { text: 'item 2', isComplete: false },
    ];
    const store = getTestStore({ todos });
    const updateTodo = replacerSync('todos').bind(store);
    updateTodo(todos[1], todo => ({
      ...todo,
      isComplete: true,
    }));
    expect(store.getState().todos).toEqual([
      { text: 'item 1', isComplete: true },
      { text: 'item 2', isComplete: true },
    ]);
  });
});
