import shallowAssign from './shallowAssign';

describe('shallowAssign()', () => {
  it('should operate on arrays', () => {
    const one = ['a', 'b'];
    const two = ['z'];
    shallowAssign(one, two);
    expect(one).toBe(one);
    expect(one).toEqual(['z', 'b']);
  });
  it('should operate on objects', () => {
    const one = { a: 1 };
    const two = { a: 97, b: 98 };
    shallowAssign(one, two);
    expect(one).toBe(one);
    expect(one).toEqual(two);
  });
  it('should leave alone scalar values', () => {
    const one = 1;
    const two = 2;
    // @ts-ignore
    shallowAssign(one, two);
    expect(one).toBe(one);
  });
});
