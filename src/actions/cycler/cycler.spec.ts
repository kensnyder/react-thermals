import { vitest, SpyInstance } from 'vitest';
import cycler from './cycler';

describe('cycler()', () => {
  it('should handle 1 value', () => {
    const setStateAt: SpyInstance = vitest.fn();
    const store = { setStateAt };
    const updater = cycler('@', ['foo']).bind(store);
    updater();
    updater();
    updater();
    expect(setStateAt.mock.calls).toEqual([
      ['@', 'foo'],
      ['@', 'foo'],
      ['@', 'foo'],
    ]);
  });
  it('should handle 2 values', () => {
    const setStateAt: SpyInstance = vitest.fn();
    const store = { setStateAt };
    const updater = cycler('@', ['on', 'off']).bind(store);
    updater();
    updater();
    updater();
    expect(setStateAt.mock.calls).toEqual([
      ['@', 'on'],
      ['@', 'off'],
      ['@', 'on'],
    ]);
  });
  it('should handle 3 values', () => {
    const setStateAt: SpyInstance = vitest.fn();
    const store = { setStateAt };
    const updater = cycler('hello', ['red', 'green', 'blue']).bind(store);
    updater();
    updater();
    updater();
    updater();
    expect(setStateAt.mock.calls).toEqual([
      ['hello', 'red'],
      ['hello', 'green'],
      ['hello', 'blue'],
      ['hello', 'red'],
    ]);
  });
});
