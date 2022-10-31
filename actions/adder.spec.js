import createStore from '../src/createStore/createStore.js';
import { adder, adderSync } from './adder.js';

function getTestStore(initialState) {
  return createStore({ state: initialState });
}

describe('adder(propName, amount)', () => {
  it('should increment', async () => {
    const store = getTestStore({ likes: 0, mode: 'view' });
    const like = adder('likes', 1).bind(store);
    const dislike = adder('likes', -1).bind(store);
    like();
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ likes: 1, mode: 'view' });
    dislike();
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ likes: 0, mode: 'view' });
  });
  it('should increment with multipath', async () => {
    const store = getTestStore({ post: { likes: 0, mode: 'view' } });
    const like = adder('post.likes', 1).bind(store);
    const dislike = adder('post.likes', -1).bind(store);
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
    const like = adderSync('likes', 1).bind(store);
    const dislike = adderSync('likes', -1).bind(store);
    like();
    expect(store.getState()).toEqual({ likes: 1, mode: 'view' });
    dislike();
    expect(store.getState()).toEqual({ likes: 0, mode: 'view' });
  });
});
