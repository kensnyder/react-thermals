import shallowCopy from '../src/shallowCopy/shallowCopy.js';

export function deepUpdater(path, transform = undefined, ...defineTimeArgs) {
  if (typeof path !== 'string') {
    throw new Error('deepUpdater path must be a string');
  }
  // split path string on dots and brackets
  // e.g. 'users[0].isActive' => ['users', '0', 'isActive']
  // e.g. '@[1].isActive' => ['1', 'isActive']
  const segments = path.split(/[\[\].]/).filter(Boolean);
  // empty string or only separators might make segments empty
  if (segments.length === 0) {
    throw new Error('deepUpdater path string cannot be empty');
  }
  // root path is denoted with at symbol
  if (path === '@') {
    return transform;
  }
  if (segments[0] === '@') {
    segments.shift();
  }
  const runTransform = getTransformerRunner(transform);
  // the actual update function that takes an object
  // and recursively creates shallow copies
  // and runs the given update function on the target segment
  return function updater(object, ...callTimeArgs) {
    return descend(object, segments, [...defineTimeArgs, ...callTimeArgs]);
  };
  // the recursive copy/update function
  function descend(object, segments, args) {
    const copy = shallowCopy(object);
    if (segments[0] === '*' && Array.isArray(copy)) {
      // we need to map over array items
      segments.shift();
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

function getTransformerRunner(transform) {
  if (
    Array.isArray(transform) &&
    transform.every(t => typeof t === 'function')
  ) {
    // run each transform function in sequence
    return function pipeTransforms(old, ...args) {
      for (const fn of transform) {
        old = fn(old, ...args);
      }
      return old;
    };
  } else if (typeof transform !== 'function') {
    // return the given transform as a value at call time
    return function setValue(old, newValue) {
      return typeof newValue === 'function' ? newValue(transform) : transform;
    };
  } else {
    // must be a function: run transform directly
    return transform;
  }
}
