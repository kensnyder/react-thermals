import shallowOverride from './shallowOverride.js';

describe('shallowOverride()', () => {
  it('should override an Array', () => {
    const value = [1, 2, 3];
    const override = [4];
    const copy = shallowOverride(value, override);
    expect(copy).toEqual([4, 2, 3]);
  });
  it('should copy an Array if no overrides are given', () => {
    const value = [1, 2, 3];
    const copy = shallowOverride(value, undefined);
    expect(copy).not.toBe(value);
    expect(copy).toEqual(value);
  });
  it('should override an Object', () => {
    const value = { a: 1, b: 2, c: 3 };
    const override = { d: 4 };
    const copy = shallowOverride(value, override);
    expect(copy).toEqual({ a: 1, b: 2, c: 3, d: 4 });
  });
  it('should copy an Object if no overrides are given', () => {
    const value = { a: 1, b: 2, c: 3 };
    const copy = shallowOverride(value, undefined);
    expect(copy).not.toBe(value);
    expect(copy).toEqual(value);
  });
  it('should override a Map', () => {
    const value = new Map([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ]);
    const override = new Map([['a', 10]]);
    const copy = shallowOverride(value, override);
    expect([...copy.entries()]).toEqual([
      ['a', 10],
      ['b', 2],
      ['c', 3],
    ]);
  });
  it('should copy an Object if no overrides are given', () => {
    const value = { a: 1, b: 2, c: 3 };
    const copy = shallowOverride(value, undefined);
    expect(copy).not.toBe(value);
    expect(copy).toEqual(value);
  });
});
