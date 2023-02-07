import Store from '../../classes/Store/Store';

/**
 * Helper function to create a setState function that adds the given amount
 * @param path  The name of or path to the value to set
 * @param baseAmount  A base amount to add
 *   e.g. use amount = 1 to create an incrementer function and amount = -1 for a decremeter function
 * @return  A function suitable for a store action
 */
export default function adder(path: string, baseAmount = 0): Function {
  return function updater(this: Store, amount: number = 0) {
    return this.setStateAt(path, (old: number) => old + baseAmount + amount);
  };
}
