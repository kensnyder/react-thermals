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
    expect(updated).toEqual({ auth: { user: 124 } });
  });
  it('should handle 2 levels with arrays', async () => {
    const state = { auth: [{ id: 125, name: 'foo' }] };
    const updated = deepUpdater('auth[0]', user => ({
      ...user,
      id: user.id + 1,
    }))(state);
    expect(updated).not.toBe(state);
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
    const updated = deepUpdater('@', () => ({ port: 1337 }))(state);
    expect(updated).not.toBe(state);
    expect(updated).toEqual({ port: 1337 });
  });
});
