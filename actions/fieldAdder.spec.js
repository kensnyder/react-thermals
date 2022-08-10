import createStore from '../src/createStore/createStore.js';
import { fieldAdder, fieldAdderSync } from './fieldAdder.js';

function getTestStore(initialState) {
  return createStore({ state: initialState });
}

describe('fieldAdder(propName, amount)', () => {
  it('should increment', async () => {
    const store = getTestStore({ likes: 0, mode: 'view' });
    const like = fieldAdder('likes', 1).bind(store);
    const dislike = fieldAdder('likes', -1).bind(store);
    like();
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ likes: 1, mode: 'view' });
    dislike();
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ likes: 0, mode: 'view' });
  });
  it('should increment with multipath', async () => {
    const store = getTestStore({ post: { likes: 0, mode: 'view' } });
    const like = fieldAdder('post.likes', 1).bind(store);
    const dislike = fieldAdder('post.likes', -1).bind(store);
    like();
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ post: { likes: 1, mode: 'view' } });
    dislike();
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ post: { likes: 0, mode: 'view' } });
  });
});
describe('fieldAdderSync(propName, amount)', () => {
  it('should increment', () => {
    const store = getTestStore({ likes: 0, mode: 'view' });
    const like = fieldAdderSync('likes', 1).bind(store);
    const dislike = fieldAdderSync('likes', -1).bind(store);
    like();
    expect(store.getState()).toEqual({ likes: 1, mode: 'view' });
    dislike();
    expect(store.getState()).toEqual({ likes: 0, mode: 'view' });
  });
});
