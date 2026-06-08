import { describe, expect, it } from 'bun:test';
import getUpdateRunner from './getUpdateRunner';

describe('getUpdateRunner()', () => {
  it('should call a function', () => {
    const increment = getUpdateRunner((x: number) => x + 1);
    expect(increment(3)).toBe(4);
  });
  it('should pipe functions', () => {
    const collatz = getUpdateRunner([
      // multiply by 3 then add 1
      (x: number) => 3 * x,
      (x: number) => x + 1,
    ]);
    expect(collatz(3)).toBe(10);
  });
  it('should provide a default transform', () => {
    const transform = getUpdateRunner();
    expect(transform(null, 'foo')).toBe('foo');
    expect(transform(null, () => 'foo')).toBe('foo');
    expect(transform(3, (x: number) => x + 1)).toBe(4);
  });
  it('should allow function transforms', () => {
    const transform = getUpdateRunner((p: number) => p + 1);
    expect(transform(2, (p: number) => p * 7)).toBe(15);
  });
  it('should throw if transform is invalid', () => {
    const thrower = () => {
      // @ts-expect-error Testing invalid input
      const transform = getUpdateRunner(42);
    };
    expect(thrower).toThrow(/must be a function/);
  });
});
