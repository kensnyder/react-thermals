/**
 * Given an action creator function, flushSync after state has been updated
 * @param {Function} actionCreator  The function to alter
 * @return {Function}  A new action creator with the same arguments
 */
export default function withFlushSync(actionCreator) {
  return function (...initArgs) {
    const asyncFn = actionCreator(...initArgs);
    return function (...runArgs) {
      // "this" is the Store instance
      asyncFn.apply(this, runArgs);
      this.flushSync();
    };
  };
}
