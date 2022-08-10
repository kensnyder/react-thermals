import shallowCopy from '../src/shallowCopy/shallowCopy.js';

export function deepUpdater(path, transform = null, ...defineTimeArgs) {
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
    if (typeof copy === 'object' && segments[0] in copy) {
      if (segments.length === 1) {
        // last segment
        copy[segments[0]] = runTransform(copy[segments[0]], ...args);
      } else {
        // recurse to next level
        copy[segments[0]] = descend(copy[segments[0]], segments.slice(1), args);
      }
    }
    // } else if (typeof object === 'object') {
    //   if (segments.length === 1) {
    //     copy[segments[0]] = runTransform({}, ...args);
    //   }
    return copy;
  }
}

function getTransformerRunner(transform) {
  if (
    Array.isArray(transform) &&
    transform.every(t => typeof t === 'function')
  ) {
    // run each transform function in sequence
    return function pipeTransforms(value, ...args) {
      for (const fn of transform) {
        value = fn(value, ...args);
      }
      return value;
    };
  } else if (typeof transform !== 'function') {
    // return the value given at call time
    return function setValue(value, ...args) {
      return typeof args[0] === 'function' ? args[0](value) : args[0];
    };
  } else {
    // must be a function: run transform directly
    return transform;
  }
}
