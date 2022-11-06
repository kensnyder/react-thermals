import selectPath from '../selectPath/selectPath';
const identity = <T>(state: T): T => state;

type MapFunction =
  | string
  | number
  | Function
  | null
  | undefined
  | string[]
  | number[]
  | Function[];

/**
 * Return a function that derives information from state
 * @param {String|Number|Array|Function|null|undefined} mapState  One of the following:
 *   - String with a property name or path (e.g. 'user' or 'user.permission')
 *   - Number for root state that is just an array
 *   - Array of mapState values
 *   - Function that is already a mapperFunction
 *   - null|undefined to return the full state
 * @return {Function}
 */
export default function getMapperFunction(mapState: MapFunction) {
  if (typeof mapState === 'string') {
    if (mapState.includes('.')) {
      return selectPath(mapState);
    }
    return (state: Record<string, any>): any => state[mapState];
  } else if (typeof mapState === 'number') {
    return (state: any[]): any => state[mapState];
  } else if (Array.isArray(mapState)) {
    const mappers = mapState.map(getMapperFunction);
    return (state: any[]): any => {
      return mappers.map(mapper => mapper(state));
    };
  } else if (typeof mapState === 'function') {
    return mapState;
  } else if (mapState === null || mapState === undefined) {
    return identity;
  } else {
    throw new Error(
      'react-thermals: "mapState" function must be a function, string, number, array, null, or undefined.'
    );
  }
}
