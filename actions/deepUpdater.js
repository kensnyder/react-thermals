import shallowCopy from '../src/shallowCopy/shallowCopy.js';

export function deepUpdater(path, updateFunction) {
  // split path string on dots and brackets
  // e.g. 'users[0].isActive' => ['users', '0', 'isActive']
  const segments = path.split(/[.\[\]]/).filter(Boolean);
  // empty string or only separators might make segments empty
  if (segments.length === 0) {
    throw new Error('deepUpdater path string cannot be empty');
  }
  // root path is denoted with at symbol
  if (path === '@') {
    return updateFunction;
  }
  // the actual update function that takes an object
  // and recursively creates shallow copies
  // and run the given update function on the last segment
  return function updater(object) {
    return descend(object, segments, updateFunction);
  };
  // the recursive copy/update function
  function descend(object, segments, updateFunction) {
    const copy = shallowCopy(object);
    if (typeof copy === 'object' && segments[0] in copy) {
      if (segments.length === 1) {
        // last segment
        copy[segments[0]] = updateFunction(copy[segments[0]]);
      } else {
        // recurse to next level
        copy[segments[0]] = descend(
          copy[segments[0]],
          segments.slice(1),
          updateFunction
        );
      }
    }
    return copy;
  }
}
