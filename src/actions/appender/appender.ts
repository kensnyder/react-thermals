import isArray from '../../lib/isArray/isArray';

/**
 * Build an action function that appends the given item(s) to an array
 * @return  A function suitable for Store#connect(function)
 * @example
 * const store = new Store({ primes: [2, 3, 5, 7] });
 * const appendPrime = store.connect('primes', appender());
 * appendPrime(11);
 * // => primes is now set to [2, 3, 5, 7, 11]
 * appendPrime(13, 17);
 * // => primes is now set to [2, 3, 5, 7, 11, 13, 17]
 */
export default function appender<Item extends any>() {
  return function updater(...newItems: Item[]) {
    return (old: Item[]) => {
      if (!old || !isArray(old)) {
        return old;
      }
      return [...old, ...newItems];
    };
  };
}
