/**
 * Helper function to create a setState function that directly sets one value
 * @return  A function suitable for store.connect(path, <function>)
 * @example
 * const store = new Store({ name: 'Bob' });
 * const setName = store.connect('name', setter());
 * setName('Alice');
 * // => store state is now { name: 'Alice' }
 *
 * // Note that the following two lines are equivalent:
 * const setName = store.connect('name', setter());
 * const setName = newName => store.setStateAt('name', newName);
 */
export function setter<ShapeAtPath>() {
  return function updater(
    newValueOrFunction: ShapeAtPath | ((old: ShapeAtPath) => ShapeAtPath)
  ) {
    return newValueOrFunction;
  };
}

/**
 * Helper function to create a setState function that directly sets one value
 * @return  A function suitable for store.connect(path, <function>)
 * @example
 * const store = new Store({ prices: [10, 20, 30] });
 * const addDeliveryFee = store.connect('prices', setterFn(price => price + 2));
 * addDeliveryFee();
 * // => "prices" now equals [12, 22, 32]
 *
 * // This function doesn't really provide any value other than
 * //   to be mentally consistent with the other setter functions.
 * // Namely, note that the following two lines are equivalent:
 * const addDeliveryFee = store.connect('prices', setterFn(price => price + 2));
 * const addDeliveryFee = store.connect('prices', () => price => price + 2);
 */
export function setterFn<ShapeAtPath>(
  handler: (old: ShapeAtPath) => ShapeAtPath
) {
  return function updater() {
    return handler;
  };
}

type InputEvent = {
  target: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
};

/**
 * Run setter and then flush pending state changes
 *   using a DOM event object to set value to evt.target.value
 * @return  A function suitable for an input's handler for onChange/onBlur/onKeyUp etc.
 * @example
 * // In /stores/search.ts
 * const store = new Store({ criteria: { term: '', category: undefined } });
 * export const setTerm = store.connect('criteria.term', setterInput());
 * export const setCategory = store.connect('criteria.category', setterInput());
 * export function useCriteria() {
 *   return return useStoreSelector(store, 'criteria');
 * }
 * // In /components/SearchForm.tsx
 * import { setTerm, setCategory, useCriteria } from '../stores/search';
 * export default function SearchForm() {
 *   const { term, category } = useCriteria();
 *   return (
 *     <form>
 *       <input value={term} onChange={setTerm} />
 *       <select value={category} onChange={setCategory}>...</select>
 *     </form>
 *   );
 * }
 */
export function setterInput() {
  return function updater(evt: InputEvent) {
    return evt.target.value;
  };
}
