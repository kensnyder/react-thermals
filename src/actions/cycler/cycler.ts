import Store from '../../classes/Store/Store';

export default function cycler(path: string, values: any[]) {
  let idx = 0;
  return function updater(this: Store) {
    this.setStateAt(path, values[idx++ % values.length]);
  };
}
