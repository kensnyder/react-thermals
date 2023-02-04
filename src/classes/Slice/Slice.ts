import { SettableStateAtPathType, StateAtType } from '../../types';
import Store from '../Store/Store';

export default class Slice<SlicePath extends string, StateType> {
  path: SlicePath;
  store: Store<StateType>;
  constructor(path: SlicePath, store: Store<StateType>) {
    this.path = path;
    this.store = store;
  }
  setState(newState: SettableStateAtPathType<SlicePath, StateType>) {
    return this.store.setStateAt(this.path, newState);
  }
  setSync(newState: SettableStateAtPathType<SlicePath, StateType>) {
    return this.store.setSyncAt(this.path, newState);
  }
  mergeState(newState: SettableStateAtPathType<SlicePath, StateType>) {
    return this.store.mergeStateAt(this.path, newState);
  }
  mergeSync(newState: SettableStateAtPathType<SlicePath, StateType>) {
    return this.store.mergeSyncAt(this.path, newState);
  }
  resetState() {
    return this.store.resetStateAt(this.path);
  }
  resetSync() {
    return this.store.resetSyncAt(this.path);
  }
  replaceSync(newState: StateAtType<SlicePath, StateType>) {
    return this.store.replaceSyncAt(this.path, newState);
  }
  extendSync(newState: StateAtType<SlicePath, StateType>) {
    return this.store.extendSyncAt(this.path, newState);
  }
}
