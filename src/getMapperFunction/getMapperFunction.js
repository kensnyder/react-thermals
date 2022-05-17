const identity = state => state;

export default function getMapperFunction(mapState) {
  if (typeof mapState === 'string' || typeof mapState === 'number') {
    return state => state[mapState];
  } else if (Array.isArray(mapState)) {
    return state => {
      const sliced = {};
      for (const field of mapState) {
        sliced[field] = state[field];
      }
      return sliced;
    };
  } else if (typeof mapState === 'function') {
    return mapState;
  } else if (mapState === null || mapState === undefined) {
    return identity;
  } else {
    throw new Error(
      'react-thermals: "mapState" function must be a function, string, number, array, or null.'
    );
  }
}
