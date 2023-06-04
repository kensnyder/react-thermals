import isArray from '../../lib/isArray/isArray';

/**
 * Build an action function that removes the given item(s) from an array
 * @return  A function suitable for Store#connect(function)
 * @example
 * const store = new Store({ primes: [2, 3, 5, 7, 11] });
 * const removePrime = store.connect('primes', remover());
 * removePrime(3);
 * // => primes is now set to [2, 5, 7, 11]
 * removePrime(5, 7);
 * // => primes is now set to [2, 11]
 */
export default function remover<Item extends any>() {
  return function updater(...itemsToRemove: Item[]) {
    return (old: Item[]) => {
      if (!old || !isArray(old)) {
        return old;
      }
      return old.filter(value => !itemsToRemove.includes(value));
    };
  };
}
