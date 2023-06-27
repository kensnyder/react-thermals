/**
 * Build an action function that cycles through the given values
 * @return  A function suitable for store.connect(path, <function>)
 * @example
 *
 * const store = new Store({ visibility: 'visible' });
 * const toggleVisibility = store.connect('visibility', cycler(['visible', 'hidden']));
 * toggleVisibility();
 * // => state "visibility" toggles between "visible" and "hidden"
 *
 * const store = new Store({ alignment: 'left' });
 * const cyclePosition = store.connect('visibility', cycler(['left', 'center', 'right]));
 * cyclePosition();
 * // => state "alignment" cycles through "left", "center", and "right", wrapping from "right" to "left" if applicable
 */
export default function cycler<PossibleValue extends any>(
  values: PossibleValue[]
) {
  return function updater() {
    return (old: PossibleValue) => {
      const currIdx = values.indexOf(old);
      return values[(currIdx + 1) % values.length];
    };
  };
}
