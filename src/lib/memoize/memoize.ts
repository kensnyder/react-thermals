const cache = new Map();
const lru = [];
export default function memoize(maxSize, fn) {
  return function memoized(...args) {
    // walk the map of maps until you get to the last argument
    // if present, move item to most recent spot
    // if not, execute and save result
    // prune cache if we are too big
    // return result
  };
}
