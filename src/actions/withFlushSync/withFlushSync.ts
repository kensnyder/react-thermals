import Store from '../../class/Store/Store';

/**
 * Given an action creator function, flushSync after state has been updated
 * @param actionCreator  The function to alter
 * @return  A new action creator with the same arguments
 */
export default function withFlushSync(actionCreator: Function) {
  return function flusher(...initArgs: any[]) {
    const asyncFn = actionCreator(...initArgs);
    return function runAction(this: Store, ...runArgs: any[]) {
      // "this" is the Store instance
      asyncFn.apply(this, runArgs);
      this.flushSync();
    };
  };
}
