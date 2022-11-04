/**
 * Given an action creator function, flushSync after state has been updated
 * @param {Function} actionCreator  The function to alter
 * @return {Function}  A new action creator with the same arguments
 */
export default function withFlushSync(actionCreator) {
  return function flusher(...initArgs) {
    const asyncFn = actionCreator(...initArgs);
    return function runAction(...runArgs) {
      // "this" is the Store instance
      asyncFn.apply(this, runArgs);
      this.flushSync();
    };
  };
}
