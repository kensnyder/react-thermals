import isArray from '../isArray/isArray';
import isFunction from '../isFunction/isFunction';
import selectPath from '../selectPath/selectPath';
const identity = <StateType>(state: StateType) => state;

type MapFunction<StateType> =
  | string
  | number
  | ((state: StateType) => any)
  | null
  | undefined;

type MapFunctions<StateType> =
  | MapFunction<StateType>[]
  | MapFunction<StateType>[][]
  | MapFunction<StateType>[][][];

/**
 * Return a function that derives information from state
 * @param mapState  One of the following:
 *   - String with a property name or path (e.g. 'user' or 'user.permission')
 *   - Number for root state that is just an array
 *   - Function that is already a mapperFunction
 *   - null|undefined to return the full state
 *   - An array of any of the items above
 */
export default function getMapperFunction<StateType>(
  mapState: MapFunction<StateType> | MapFunctions<StateType>
): Function {
  if (typeof mapState === 'string') {
    if (mapState.includes('.')) {
      return selectPath(mapState);
    }
    return (state: StateType): any => state[mapState];
  } else if (typeof mapState === 'number') {
    return (state: StateType): any => state[mapState];
  } else if (isArray(mapState as any)) {
    const mappers = (mapState as Array<any>).map(getMapperFunction);
    return (state: StateType): any => {
      return mappers.map(mapper => mapper(state));
    };
  } else if (isFunction(mapState)) {
    return mapState;
  } else if (mapState === null || mapState === undefined) {
    return identity;
  } else {
    throw new Error(
      'react-thermals: "mapState" function must be a function, string, number, array, null, or undefined.'
    );
  }
}
