/**
 * Build a setState function that merges the given object with the target object
 * @return  A function suitable for a store action
 */
export default function merger<StateShape>() {
  return function updater(withValues: Partial<StateShape>) {
    return (old): StateShape => ({
      ...old,
      ...withValues,
    });
  };
}
