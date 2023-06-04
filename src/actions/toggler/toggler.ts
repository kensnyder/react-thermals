/**
 * Helper function to create a setState function that directly toggles one value
 * @return  A function suitable for store.connect(path, fn)
 */
export default function toggler() {
  return function updater() {
    return (old: boolean) => !old;
  };
}
