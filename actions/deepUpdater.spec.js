import { deepUpdater } from './deepUpdater.js';

describe('deepUpdater', () => {
  it('should throw exceptions on non-string path', () => {
    const thrower = () => deepUpdater(5);
    expect(thrower).toThrow(/must be a string/);
  });
  it('should throw exceptions on bad path', () => {
    const thrower = () => deepUpdater('');
    expect(thrower).toThrow(/cannot be empty/);
  });
  it('should handle 1 level', () => {
    const state = { movie: 'Cars' };
    const makeSequel = deepUpdater('movie', title => title + ' 2');
    const updated = makeSequel(state);
    expect(updated).not.toBe(state);
    expect(updated).toEqual({ movie: 'Cars 2' });
  });
  it('should handle 2 levels', () => {
    const state = { player: { xp: 123 } };
    const levelUp = deepUpdater('player.xp', xp => xp + 1);
    const updated = levelUp(state);
    expect(updated).not.toBe(state);
    expect(updated.player).not.toBe(state.player);
    expect(updated.player.xp).not.toBe(state.player.xp);
    expect(updated).toEqual({ player: { xp: 124 } });
  });
  it('should handle 2 levels with arrays', () => {
    const state = { posts: [{ id: 125, likes: 5 }] };
    const likePost = deepUpdater('posts[0]', post => ({
      ...post,
      likes: post.likes + 1,
    }));
    const updated = likePost(state);
    expect(updated).not.toBe(state);
    expect(updated.posts).not.toBe(state.posts);
    expect(updated).toEqual({ posts: [{ id: 125, likes: 6 }] });
  });
  it('should set non-existent path on objects', () => {
    const state = {};
    const greetWorld = deepUpdater('hello', () => 'world');
    const updated = greetWorld(state);
    expect(updated).not.toBe(state);
    expect(updated).toEqual({ hello: 'world' });
  });
  it('should set multiple non-existent paths on objects', () => {
    const state = {};
    const greetWorld = deepUpdater('math.pi.short', '3.1415926');
    const updated = greetWorld(state);
    expect(updated).not.toBe(state);
    expect(updated).toEqual({ math: { pi: { short: '3.1415926' } } });
  });
  it('should handle numeric non-existent paths', () => {
    const state = {};
    const setText = deepUpdater('todos[0].text', () => 'test');
    const updated = setText(state);
    expect(updated).not.toBe(state);
    expect(updated).toEqual({ todos: [{ text: 'test' }] });
  });
  it('should handle non-existent paths on scalar', () => {
    const state = 5;
    const greetWorld = deepUpdater('hello', greeting => greeting + ' world');
    const updated = greetWorld(state);
    expect(updated).toBe(5);
  });
  it('should handle only asterisk', () => {
    const state = [2, 3, 5, 7];
    const primesTimes9 = deepUpdater('*', greeting => greeting * 9);
    const updated = primesTimes9(state);
    expect(updated).toEqual([18, 27, 45, 63]);
  });
  it('should handle asterisk at end', () => {
    const state = { ids: [1, 2, 3] };
    const squareIds = deepUpdater('ids.*', greeting => greeting * 2);
    const updated = squareIds(state);
    expect(updated).toEqual({ ids: [2, 4, 6] });
  });
  it('should handle asterisk in the middle', () => {
    const state = {
      todos: [
        { text: 'one', complete: false },
        { text: 'two', complete: false },
      ],
    };
    const markAllComplete = deepUpdater('todos.*.complete', () => true);
    const updated = markAllComplete(state);
    expect(updated).toEqual({
      todos: [
        { text: 'one', complete: true },
        { text: 'two', complete: true },
      ],
    });
  });
  it('should handle out-of-range array numbers', () => {
    const state = { todos: [{ text: 'one' }] };
    const setText = deepUpdater('todos.[1].text', 'two');
    const updated = setText(state);
    expect(updated).not.toBe(state);
    expect(updated).toEqual({ todos: [{ text: 'one' }, { text: 'two' }] });
  });
  it('should handle asterisk with non-existent path', () => {
    const state = {};
    const setText = deepUpdater('todos.*.text', () => 'test');
    const updated = setText(state);
    expect(updated).not.toBe(state);
    expect(updated).toEqual({ todos: [] });
  });
  it('should handle root path', () => {
    const state = { url: 'https://example.com' };
    const addPort = deepUpdater('@', old => ({ ...old, port: 1337 }));
    const updated = addPort(state);
    expect(updated).not.toBe(state);
    expect(updated).toEqual({ url: 'https://example.com', port: 1337 });
  });
  it('should handle scalars at the root', () => {
    const state = 5;
    const double = deepUpdater('@', score => score * 2);
    const updated = double(state);
    expect(updated).toBe(10);
  });
  it('should handle scalars in Array', () => {
    const state = [5];
    const triple = deepUpdater('@[0]', score => score * 3);
    const updated = triple(state);
    expect(updated).not.toBe(state);
    expect(updated).toEqual([15]);
  });
  it('should allow a transform to be an array of functions', () => {
    const state = { cart: [{ price: 35 }] };
    const applyDiscount = deepUpdater('cart[0].price', [
      p => p / 5,
      p => p / 7,
    ]);
    const updated = applyDiscount(state);
    expect(updated).not.toBe(state);
    expect(updated.cart).not.toBe(state.cart);
    expect(updated).toEqual({ cart: [{ price: 1 }] });
  });
});
