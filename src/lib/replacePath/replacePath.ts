import shallowCopy from '../shallowCopy/shallowCopy';
import { StateAtType, FunctionStateAtType } from '../../types';

/**
 * Deep updater takes a path plus a transformer and returns a function
 *   that will take in an object and return a copy of that object
 *   with that transform applied to the value at "path"
 * @param path  Path string such as "cart" or "cart.total"
 * @param transform  Transform function(s) to update the value at the given path
 * @return
 */
export function replacePath<StateType, Path extends string>(
  fullState: StateType,
  path: Path,
  newValue: StateAtType<Path, StateType> | FunctionStateAtType<Path, StateType>
): StateType {
  if (typeof path !== 'string') {
    throw new Error(
      'react-thermals: replacePath(path,transform) - path must be a string'
    );
  }
  // split path string on dots and brackets
  // e.g. 'users[0].isActive' => ['users', '0', 'isActive']
  // e.g. 'posts[*].isActive' => ['posts', '*', 'isActive']
  const allSegments = path.split(/[\[\].]/).filter(Boolean);
  // empty string or only separators might make segments empty
  if (allSegments.length === 0) {
    throw new Error(
      'react-thermals: replacePath(path,transform) path string cannot be empty'
    );
  }
  return descend(fullState, allSegments, newValue);
}

// the recursive copy/update function
function descend(object: any, segments: string[], newValue: any): any {
  const copy = shallowCopy(object);
  if (segments[0] === '*' && copy instanceof Array) {
    // we need to map over array items
    segments = segments.slice(1);
    return copy.map(leaf => {
      if (segments.length === 0) {
        // star is at the end of path
        return typeof newValue === 'function' ? newValue(leaf) : newValue;
      } else {
        // we can recurse further
        return descend(leaf, segments, newValue);
      }
    });
  } else if (typeof copy === 'object' && segments[0] in copy) {
    // we need to apply the transform or recurse
    if (segments.length === 1) {
      // last segment
      copy[segments[0]] =
        typeof newValue === 'function' ? newValue(copy[segments[0]]) : newValue;
    } else {
      // recurse to next level
      copy[segments[0]] = descend(
        copy[segments[0]],
        segments.slice(1),
        newValue
      );
    }
  } else if (typeof copy === 'object') {
    // When path doesn't exist, create empty objects along the way
    if (segments.length === 1) {
      copy[segments[0]] =
        typeof newValue === 'function' ? newValue(copy[segments[0]]) : newValue;
    } else {
      if (segments[1] === '*') {
        copy[segments[0]] = [];
      } else {
        const empty = /^(\d+)$/.test(segments[1]) ? [] : {};
        copy[segments[0]] = descend(empty, segments.slice(1), newValue);
      }
    }
  }
  return copy;
}
