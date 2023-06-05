import SimpleCache from './SimpleCache';

describe('new SimpleCache()', () => {
  it('should have correct size', () => {
    const cache = new SimpleCache(10);
    expect(cache.size).toBe(0);
    cache.set('a', 1);
    expect(cache.size).toBe(1);
  });
  it('should return cached values', () => {
    const cache = new SimpleCache();
    cache.set('a', 1);
    expect(cache.has('a')).toBe(true);
    expect(cache.get('a')).toBe(1);
  });
  it('should purge cache', () => {
    const cache = new SimpleCache(1);
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.size).toBe(1);
  });
});
describe('SimpleCache.memoize()', () => {
  it('should memoize by string', () => {
    let runCount = 0;
    const expensive = (name: string) => {
      runCount++;
      return `Mr ${name}`;
    };

    const memoized = SimpleCache.memoize(10, expensive);
    const result = memoized('Jones');
    expect(runCount).toBe(1);
    expect(result).toBe('Mr Jones');
    const result2 = memoized('Jones');
    expect(runCount).toBe(1);
    expect(result2).toBe('Mr Jones');
  });
});
