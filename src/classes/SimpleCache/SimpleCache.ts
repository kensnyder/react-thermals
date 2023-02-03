export default class SimpleCache {
  #_cache: Record<string, any> = {};
  #_stack: string[] = [];
  maxSize: number;
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }
  has(key: string): boolean {
    return key in this.#_cache;
  }
  get(key: string): any {
    return this.#_cache[key];
  }
  set(key: string, value: any): void {
    if (this.#_stack.length >= this.maxSize) {
      this.#_prune();
    }
    this.#_cache[key] = value;
    this.#_stack.push(key);
  }
  get size() {
    return this.#_stack.length;
  }
  #_prune(): void {
    const oldestKey = this.#_stack.shift();
    this.#_cache[oldestKey] = undefined;
  }
  static memoize(maxSize: number, fn: Function): Function {
    const cache = new SimpleCache(maxSize);
    return function memoized(key: string) {
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(key);
      cache.set(key, result);
      return result;
    };
  }
}
