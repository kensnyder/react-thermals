import SimpleCache from '../../classes/SimpleCache/SimpleCache';

const identity = state => state;

/**
 * Build a function that will return state at a certain path
 * @param path  Path string such as "cart" or "cart.total"
 * @return  A function that can be used to get the path on any object
 */
export function doSelect(path: string): Function {
  if (path === '@') {
    return identity;
  }
  const allSegments = path.split(/[\[\].]/).filter(Boolean);
  if (allSegments.length === 1) {
    // simplified function for the trivial case when path is just a prop name
    return function get(state: any): any {
      return state[allSegments[0]];
    };
  }
  return function get(state: any): any {
    return descend(state, allSegments);
  };
  // the recursive selector
  function descend(state: any, segments: string[]): any {
    if (segments.length === 0) {
      return state;
    } else if (segments[0] === '*' && Array.isArray(state)) {
      // we need to map over array items and recurse
      segments = segments.slice(1); // remove that * segment
      return state.map((item: any) => descend(item, segments)).flat();
    } else if (segments[0] in state) {
      return descend(state[segments[0]], segments.slice(1));
    } else {
      return undefined;
    }
  }
}

const selectPath = SimpleCache.memoize(5000, doSelect);

export default selectPath;
