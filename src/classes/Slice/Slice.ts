import type { SetStateOptionsType, SettableStateAtPathType } from '../../types';
import Store from '../Store/Store';

export default class Slice<SlicePath extends string, StateType> {
  path: SlicePath;
  store: Store<StateType>;
  constructor(path: SlicePath, store: Store<StateType>) {
    this.path = path;
    this.store = store;
  }
  setState(
    newStateOrUpdater: SettableStateAtPathType<SlicePath, StateType>,
    options: SetStateOptionsType = {}
  ) {
    return this.store.setStateAt(this.path, newStateOrUpdater, options);
  }
  mergeState(
    newStateOrUpdater: SettableStateAtPathType<SlicePath, StateType>,
    options: SetStateOptionsType = {}
  ) {
    return this.store.mergeStateAt(this.path, newStateOrUpdater, options);
  }
  resetState(options: SetStateOptionsType = {}) {
    return this.store.resetStateAt(this.path, options);
  }
}
