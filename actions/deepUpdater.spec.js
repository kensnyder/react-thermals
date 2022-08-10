import { deepUpdater } from './deepUpdater.js';

describe('deepUpdater', () => {
  it('should handle 1 level', async () => {
    const state = { foo: 'bar' };
    const updated = deepUpdater('foo', str => str + '2')(state);
    expect(updated).not.toBe(state);
    expect(updated).toEqual({ foo: 'bar2' });
  });
  it('should handle 2 levels', async () => {
    const state = { auth: { user: 123 } };
    const updated = deepUpdater('auth.user', id => id + 1)(state);
    expect(updated).not.toBe(state);
    expect(updated.auth).not.toBe(state.auth);
    expect(updated).toEqual({ auth: { user: 124 } });
  });
  it('should handle 2 levels with arrays', async () => {
    const state = { auth: [{ id: 125, name: 'foo' }] };
    const updated = deepUpdater('auth[0]', user => ({
      ...user,
      id: user.id + 1,
    }))(state);
    expect(updated).not.toBe(state);
    expect(updated.auth).not.toBe(state.auth);
    expect(updated).toEqual({ auth: [{ id: 126, name: 'foo' }] });
  });
  it('should handle non-existent paths on objects', async () => {
    const state = {};
    const updated = deepUpdater(
      'hello',
      greeting => greeting + ' world'
    )(state);
    expect(updated).not.toBe(state);
    expect(updated).toEqual({});
  });
  it('should handle non-existent paths on scalar', async () => {
    const state = 5;
    const updated = deepUpdater(
      'hello',
      greeting => greeting + ' world'
    )(state);
    expect(updated).toBe(5);
  });
  it('should handle root path', async () => {
    const state = { hello: 'world' };
    const updated = deepUpdater('@', old => ({ ...old, port: 1337 }))(state);
    expect(updated).not.toBe(state);
    expect(updated).toEqual({ hello: 'world', port: 1337 });
  });
  it('should handle scalars at the root', async () => {
    const state = 5;
    const updated = deepUpdater('@', score => score * 2)(state);
    expect(updated).toBe(10);
  });
  it('should handle scalars in Array', async () => {
    const state = [5];
    const updated = deepUpdater('@[0]', score => score * 2)(state);
    expect(updated).not.toBe(state);
    expect(updated).toEqual([10]);
  });
  it('should set a value', async () => {
    const state = { auth: [{ id: 125, name: 'foo' }] };
    const setName = deepUpdater('auth[0].name');
    const updated = setName(state, 'bar');
    expect(updated).not.toBe(state);
    expect(updated.auth).not.toBe(state.auth);
    expect(updated).toEqual({ auth: [{ id: 125, name: 'bar' }] });
  });
  it('should allow a transform to be an array of functions', async () => {
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
