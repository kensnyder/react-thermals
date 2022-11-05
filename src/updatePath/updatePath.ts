import shallowCopy from '../shallowCopy/shallowCopy';
import getUpdateRunner from './getUpdateRunner';

/**
 * Deep updater takes a path and a transformer and returns a function
 *   that will take in an object and return a copy of that object
 *   with that transform applied to the value at "path"
 * @param {String} path
 * @param {Function|Function[]|undefined} transform
 * @return {Function}
 */
export function updatePath(
  path: string,
  transform: undefined | Function | Array<Function> = undefined
): Function {
  if (typeof path !== 'string') {
    throw new Error(
      'react-thermals: updatePath(path,transform) - path must be a string'
    );
  }
  // split path string on dots and brackets
  // e.g. 'users[0].isActive' => ['users', '0', 'isActive']
  // e.g. '@[1].isActive' => ['1', 'isActive']
  const allSegments = path.split(/[\[\].]/).filter(Boolean);
  // empty string or only separators might make segments empty
  if (allSegments.length === 0) {
    throw new Error('updatePath path string cannot be empty');
  }
  const runTransform: Function = getUpdateRunner(transform);
  // root path is denoted with at symbol
  if (path === '@') {
    return runTransform;
  }
  if (allSegments[0] === '@') {
    allSegments.shift();
  }
  // the actual update function that takes an object
  // and recursively creates shallow copies
  // and runs the given update function on the target segment
  return function updater<T>(object: T, ...callTimeArgs: Array<any>): T {
    return descend(object, allSegments, callTimeArgs);
  };
  // the recursive copy/update function
  function descend(
    object: any,
    segments: Array<string>,
    args: Array<any>
  ): any {
    const copy = shallowCopy(object);
    if (segments[0] === '*' && copy instanceof Array) {
      // we need to map over array items
      segments = segments.slice(1);
      return copy.map(item => {
        if (segments.length === 0) {
          // star is at the end of path
          return runTransform(item, ...args);
        } else {
          // we can recurse further
          return descend(item, segments, args);
        }
      });
    } else if (typeof copy === 'object' && segments[0] in copy) {
      // we need to apply the transform or recurse
      if (segments.length === 1) {
        // last segment
        copy[segments[0]] = runTransform(copy[segments[0]], ...args);
      } else {
        // recurse to next level
        copy[segments[0]] = descend(copy[segments[0]], segments.slice(1), args);
      }
    } else if (typeof copy === 'object') {
      // When path doesn't exist, create empty objects along the way
      if (segments.length === 1) {
        copy[segments[0]] = runTransform(undefined, ...args);
      } else {
        if (segments[1] === '*') {
          copy[segments[0]] = [];
        } else {
          const empty = /^(\d+)$/.test(segments[1]) ? [] : {};
          copy[segments[0]] = descend(empty, segments.slice(1), args);
        }
      }
    }
    return copy;
  }
}
