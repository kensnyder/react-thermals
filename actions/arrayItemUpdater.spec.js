import createStore from '../src/createStore/createStore.js';
import { arrayItemUpdater, arrayItemUpdaterSync } from './arrayItemUpdater.js';

function getTestStore(initialState) {
  return createStore({ state: initialState });
}

describe('arrayItemUpdater()', () => {
  it('should update a single item with an updater', async () => {
    const todos = [
      { text: 'item 0', isComplete: true },
      { text: 'item 1', isComplete: false },
    ];
    const store = getTestStore({ todos });
    const updateTodo = arrayItemUpdater('todos').bind(store);
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
describe('arrayItemUpdaterSync()', () => {
  it('should update a single item synchronously with an updater', () => {
    const todos = [
      { text: 'item 1', isComplete: true },
      { text: 'item 2', isComplete: false },
    ];
    const store = getTestStore({ todos });
    const updateTodo = arrayItemUpdaterSync('todos').bind(store);
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
