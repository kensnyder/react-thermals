import shallowCopy from './shallowCopy';

describe('shallowCopy()', () => {
  it('should copy an Array', () => {
    const value = [1, 2, 3];
    const copy = shallowCopy(value);
    expect(value).not.toBe(copy);
    expect(value).toEqual(copy);
  });
  it('should copy an Object', () => {
    const value = { a: 1, b: 2, c: 3 };
    const copy = shallowCopy(value);
    expect(value).not.toBe(copy);
    expect(value).toEqual(copy);
  });
  it('should copy a Map', () => {
    const value = new Map([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ]);
    const copy = shallowCopy(value);
    expect(value).not.toBe(copy);
    expect(value).toEqual(copy);
  });
  it('should copy a Set', () => {
    const value = new Set([1, 2, 3]);
    const copy = shallowCopy(value);
    expect(value).not.toBe(copy);
    expect(value).toEqual(copy);
  });
  it('should return booleans', () => {
    const value = true;
    const copy = shallowCopy(value);
    expect(value).toBe(copy);
  });
  it('should return strings', () => {
    const value = 'hello';
    const copy = shallowCopy(value);
    expect(value).toBe(copy);
  });
  it('should return numbers', () => {
    const value = 42;
    const copy = shallowCopy(value);
    expect(value).toBe(copy);
  });
  it('should return BigInt', () => {
    const value = 42n;
    const copy = shallowCopy(value);
    expect(value).toBe(copy);
  });
});
