// TODO: test and document function
import { updatePath } from '../../lib/updatePath/updatePath';

export default function cycle(path: string, values: any[]) {
  let idx = 0;
  const nextValue = updatePath(path, function doCycle() {
    return values[idx++ % values.length];
  });
  return function updater() {
    this.setState(nextValue);
  };
}
