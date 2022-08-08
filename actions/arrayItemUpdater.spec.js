import createStore from '../src/createStore/createStore.js';
import { arrayItemUpdater, arrayItemUpdaterSync } from './arrayItemUpdater.js';

function getTestStore(initialState) {
  return createStore({ state: initialState });
}

describe('arrayItemUpdater', () => {
  it('should update a single item with an updater', async () => {
    const todos = [
      { text: 'item 1', isComplete: true },
      { text: 'item 2', isComplete: false },
    ];
    const store = getTestStore({ todos });
    const completer = arrayItemUpdater('todos', todo => ({
      ...todo,
      isComplete: true,
    }));
    const markComplete = completer.bind(store);
    markComplete(todos[1]);
    expect(store.getState()).toEqual({ todos });
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState().todos).toEqual([
      { text: 'item 1', isComplete: true },
      { text: 'item 2', isComplete: true },
    ]);
  });
  it('should update a single item with the default updater', async () => {
    const todos = [
      { text: 'item 1', isComplete: true },
      { text: 'item 2', isComplete: false },
    ];
    const store = getTestStore({ todos });
    const updateText = arrayItemUpdater('todos').bind(store);
    updateText(todos[0], { text: 'item 1b' });
    expect(store.getState()).toEqual({ todos });
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState().todos).toEqual([
      { text: 'item 1b', isComplete: true },
      { text: 'item 2', isComplete: false },
    ]);
  });
});
describe('arrayItemUpdaterSync(propName, updaterFunction)', () => {
  it('should update a single item synchronously with an updater', () => {
    const todos = [
      { text: 'item 1', isComplete: true },
      { text: 'item 2', isComplete: false },
    ];
    const store = getTestStore({ todos });
    const completer = arrayItemUpdaterSync('todos', todo => ({
      ...todo,
      isComplete: true,
    }));
    const markComplete = completer.bind(store);
    markComplete(todos[1]);
    expect(store.getState().todos).toEqual([
      { text: 'item 1', isComplete: true },
      { text: 'item 2', isComplete: true },
    ]);
  });
  it('should update a single item synchronously with the default updater', async () => {
    const todos = [
      { text: 'item 1', isComplete: true },
      { text: 'item 2', isComplete: false },
    ];
    const store = getTestStore({ todos });
    const markComplete = arrayItemUpdaterSync('todos').bind(store);
    markComplete(todos[1], { isComplete: true });
    expect(store.getState().todos).toEqual([
      { text: 'item 1', isComplete: true },
      { text: 'item 2', isComplete: true },
    ]);
  });
});
