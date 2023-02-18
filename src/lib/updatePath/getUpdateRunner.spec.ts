import getUpdateRunner from './getUpdateRunner';

describe('getUpdateRunner()', () => {
  it('should call a function', () => {
    const increment = getUpdateRunner(x => x + 1);
    expect(increment(3)).toBe(4);
  });
  it('should pipe functions', () => {
    const collatz = getUpdateRunner([
      // multiply by 3 then add 1
      x => 3 * x,
      x => x + 1,
    ]);
    expect(collatz(3)).toBe(10);
  });
  it('should provide a default transform', () => {
    const transform = getUpdateRunner();
    expect(transform(null, 'foo')).toBe('foo');
    expect(transform(null, () => 'foo')).toBe('foo');
    expect(transform(3, x => x + 1)).toBe(4);
  });
  // it('should allow function transforms', () => {
  //   const transform = getUpdateRunner(p => p + 1);
  //   expect(transform(2, p => p ** p)).toBe(9);
  // });
});
