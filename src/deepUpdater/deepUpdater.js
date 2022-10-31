import shallowCopy from '../shallowCopy/shallowCopy.js';
import getTransformerRunner from './getTransformerRunner.js';

/**
 * Deep updater takes a path and a transformer and returns a function
 *   that will take in an object and return a copy of that object
 *   with that transform applied to the value at "path"
 * @param {String} path
 * @param {Function|Function[]|undefined} transform
 * @return {Function}
 *
 * @example
 *
 * const nextPage = deepUpdater('page', page => page + 1);
 * nextPage({ page: 10 });
 * // result:
 * { page: 11 }
 *
 * const addTodo = deepUpdater('app.todos', (todos, newItem) => ([...todos, newItem]));
 * const state = {
 *    app: {
 *        todos: ['Go shopping', 'Wash Car']
 *    },
 * };
 * addTodo(state, 'Make dinner');
 * // result:
 * {
 *    app: {
 *        todos: ['Go shopping', 'Wash Car', 'Make dinner']
 *    },
 * }
 *
 * const toggleActive = deepUpdater('users.*.isActive', isActive => !isActive);
 * toggleActive({
 *    users: [
 *      { id: 1, isActive: false },
 *      { id: 2, isActive: true },
 *    ]
 * });
 * // result:
 * {
 *    users: [
 *      { id: 1, isActive: true },
 *      { id: 2, isActive: false },
 *    ]
 * }
 *
 * const add = deepUpdater('total', (total, addend) => total + addend);
 * add({ total: 12 }, 7);
 * // result:
 * { total: 19 }
 *
 * const add = deepUpdater('@', (num, addend) => num + addend);
 * add(12, 7);
 * // result:
 * 19
 */
export function deepUpdater(path, transform = undefined) {
  if (typeof path !== 'string') {
    throw new Error(
      'react-thermals: deepUpdater(path,transform) - path must be a string'
    );
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
    return descend(object, segments, callTimeArgs);
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
