import { useState, useEffect, useMemo } from 'react';
import defaultEqualityFn from '../defaultEqualityFn/defaultEqualityFn';
import getMapperFunction from '../getMapperFunction/getMapperFunction';
import { SetterType } from '../Store/Setter.type';

/**
 * @param {Object} store - A store created with createStore()
 * @param {Function|String|String[]} [mapState] - Function that returns a slice of data
 * @param {Function} [equalityFn] - Custom equality function that checks if state has change
 * @return {*} - The selected
 */
export default function useStoreSelector(
  store: any,
  mapState: Function | null = null,
  equalityFn: Function | null = null
) {
  // derive and cache the mapState and equalityFn
  const [map, isEqual] = useMemo(() => {
    return [getMapperFunction(mapState), equalityFn || defaultEqualityFn];
    // assume "mapState" and "equalityFn" args are stable like redux does
  }, []);

  // use useState to get a method for triggering re-renders in consumer components
  const [partialState, setPartialState] = useState(() => {
    const fullInitialState = store.getState();
    if (!store.hasInitialized()) {
      const event = store.emit('BeforeInitialState', fullInitialState);
      const mapped = map(event.data);
      if (event.data !== fullInitialState) {
        store.mergeSync(mapped);
      }
      return mapped;
    }
    return map(fullInitialState);
  });

  // on first mount, save that setState method as a trigger
  useEffect(() => {
    const updater: SetterType = {
      mapState: map,
      equalityFn: isEqual,
      handler: setPartialState,
    };
    store._subscribe(updater);
    return () => store._unsubscribe(updater);
  }, [store, setPartialState]);

  // return that slice or whole bit of state
  return partialState;
}
