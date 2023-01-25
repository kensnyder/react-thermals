export default class SimpleCache {
  #_cache = {};
  #_stack = [];
  maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  has(key) {
    return key in this.#_cache;
  }
  get(key) {
    return this.#_cache[key];
  }
  set(key, value) {
    if (this.#_stack.length >= this.maxSize) {
      this.#_prune();
    }
    this.#_cache[key] = value;
    this.#_stack.push(key);
  }
  #_prune() {
    const oldestKey = this.#_stack.unshift();
    this.#_cache[oldestKey] = undefined;
  }
  static memoize(maxSize, fn) {
    const cache = new SimpleCache(maxSize);
    return function memoized(key) {
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(key);
      cache.set(key, result);
      return result;
    };
  }
}
