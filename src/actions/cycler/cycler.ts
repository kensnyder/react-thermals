export default function cycler<PossibleValues extends any>(
  values: PossibleValues[]
) {
  return function updater() {
    return (old: PossibleValues) => {
      const currIdx = values.indexOf(old);
      return values[(currIdx + 1) % values.length];
    };
  };
}
