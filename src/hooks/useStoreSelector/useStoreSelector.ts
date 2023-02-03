import { useState, useEffect, useMemo } from 'react';
import defaultEqualityFn from '../../lib/defaultEqualityFn/defaultEqualityFn';
import getMapperFunction from '../../lib/getMapperFunction/getMapperFunction';
import { SetterType, StateMapperOrMappersType } from '../../types';
import Store from '../../classes/Store/Store';

/**
 * Hook to request updated values any time a relevant portion of state changes
 * @param store - A store created with createStore()
 * @param [mapState] - Function that returns a slice of data
 * @param [equalityFn] - Custom equality function that checks if state has change
 * @return The selected state
 */
export default function useStoreSelector<StateType, SelectedState>(
  store: Store<StateType>,
  mapState: StateMapperOrMappersType<StateType, SelectedState> = undefined,
  equalityFn:
    | ((prev: SelectedState, next: SelectedState) => boolean)
    | undefined = undefined
): any {
  // derive and cache the mapState and equalityFn
  const [map, isEqual] = useMemo(() => {
    return [
      getMapperFunction<StateType>(mapState),
      equalityFn || defaultEqualityFn,
    ];
    // assume "mapState" and "equalityFn" args are stable like redux does
  }, []);

  // use useState to get a method for triggering re-renders in consumer components
  const [mappedState, setState] = useState(() => {
    let fullInitialState = store.getState();
    if (!store.hasInitialized()) {
      store.emit('BeforeInitialize', fullInitialState);
      // re-assign state in case a handler changed it
      fullInitialState = store.getState();
      store.emit('AfterInitialize', fullInitialState);
    }
    return map(fullInitialState);
  });

  // on first mount, save that setState method as a trigger
  useEffect(() => {
    const updater = {
      mapState: map,
      equalityFn: isEqual,
      handler: setState,
    } as SetterType<StateType, SelectedState>;
    store._subscribe(updater);
    return () => store._unsubscribe(updater);
  }, [store, setState]);

  // return that slice or whole bit of state
  return mappedState;
}
