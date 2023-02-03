import { useState, useEffect } from 'react';
import Store from '../../classes/Store/Store';
import { SetterType } from '../../types';

/**
 * Hook to request state values any time state changes
 * @param store An instance of Store
 * @return  The entire state value that will rerender the host Component
 *   when the state value changes
 */
export default function useStoreState<StateType>(
  store: Store<StateType>
): StateType {
  // use useState to get a method for triggering re-renders in consumer components
  const [state, setState] = useState(() => {
    // read the initial state and emit BeforeFirstUse if not yet initialized
    let fullInitialState = store.getState();
    if (!store.hasInitialized()) {
      store.emit('BeforeInitialize', fullInitialState);
      // re-assign state in case a handler changed it
      fullInitialState = store.getState();
      store.emit('AfterInitialize', fullInitialState);
    }
    return fullInitialState;
  });

  // on first mount, save that setState method as a trigger
  useEffect(() => {
    const setter: SetterType<StateType, any> = {
      handler: setState,
    };
    store._subscribe(setter);
    return () => store._unsubscribe(setter);
  }, [store]);

  // the entire state value will then be here to return
  return state;
}
