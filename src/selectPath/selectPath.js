/**
 * Build a function that will return state at a certain path
 * @param {String} path  Path string such as "cart" or "cart.total"
 * @return {Function}
 */
export default function selectPath(path) {
  const allSegments = path.split(/[\[\].]/).filter(Boolean);
  if (allSegments.length === 1) {
    // simplified function for the trivial case when path is just a prop name
    return function get(state) {
      return state[allSegments[0]];
    };
  }
  return function get(state) {
    return descend(state, allSegments);
  };
  // the recursive selector
  function descend(state, segments) {
    if (segments.length === 0) {
      return state;
    } else if (segments[0] === '*' && Array.isArray(state)) {
      // we need to map over array items and recurse
      segments = segments.slice(1); // remove that * segment
      return state.map(item => descend(item, segments)).flat();
    } else if (segments[0] in state) {
      return descend(state[segments[0]], segments.slice(1));
    } else {
      return undefined;
    }
  }
}
