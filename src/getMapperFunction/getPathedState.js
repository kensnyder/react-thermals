/**
 * Build a function that will return state at a certain path
 * @param {String} path  Path string such as "cart.total"
 * @return {Function}
 */
export default function getPathedState(path) {
  const segments = path.split('.');
  return function descend(state, level = 0) {
    if (level === segments.length) {
      return state;
    }
    if (!(segments[level] in state)) {
      return undefined;
    }
    return descend(state[segments[level]], level + 1);
  };
}
