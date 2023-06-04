/**
 * Helper function to create a setState function that directly sets one value
 * @return  A function suitable for store.connect(path, fn)
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
 * @return  A function suitable for store.connect(path, fn)
 * @example
 * const store = new Store({ name: 'Bob' });
 *
 *
 */
export function setterFn<ShapeAtPath>(
  handler: (old: ShapeAtPath) => ShapeAtPath
) {
  return () => handler;
}

type InputEvent = {
  target: HTMLInputElement | HTMLTextAreaElement;
};

/**
 * Run setter and then flush pending state changes
 * using a DOM event object to set value to evt.target.value
 * @return  A function suitable for an input's handler for onChange/onBlur/onKeyUp etc.
 */
export function setterInput() {
  return function updater(evt: InputEvent) {
    return evt.target.value;
  };
}
