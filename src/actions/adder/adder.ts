import withFlushSync from '../withFlushSync/withFlushSync';
import Store from '../../classes/Store/Store';

/**
 * Helper function to create a setState function that adds the given amount
 * @param path  The name of or path to the value to set
 * @param baseAmount  A base amount to add
 *   e.g. use amount = 1 to create an incrementer function and amount = -1 for a decremeter function
 * @return  A function suitable for a store action
 */
export function adder<Path extends string>(
  path: Path,
  baseAmount = 0
): Function {
  return function updater(this: Store, amount: number = 0) {
    return this.setStateAt(path, (old: number) => old + baseAmount + amount);
  };
}

/**
 * Run adder and then flush pending state changes
 * e.g. use amount = 1 to create an incrementer function and amount = -1 for a decremeter function
 * @param path  The name of or path to the property to toggle
 * @return  A function suitable for a store action
 */
export const adderSync: Function = withFlushSync(adder);
