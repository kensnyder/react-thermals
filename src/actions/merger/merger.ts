/**
 * Build a setState function that merges the given object with the target object
 * @return  A function suitable for store.connect(path, <function>)
 * @example
 *
 * const store = new Store({ user: { name: 'John', age: 30 } });
 * const patchUser = store.connect('user', merger());
 * patchUser({ age: 31 });
 * // => "user" is now set to { name: 'John', age: 31 }
 */
export default function merger<StateShape>() {
  return function updater(withValues: Partial<StateShape>) {
    return (old): StateShape => ({
      ...old,
      ...withValues,
    });
  };
}
