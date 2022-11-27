import { useState, useEffect } from 'react';
import Store from '../../classes/Store/Store';
import { SetterType } from '../../types';

/**
 * Hook to request state values any time state changes
 * @param store An instance of Store
 * @return  The entire state value that will rerender the host Component
 *   when the state value changes
 */
export default function useStoreState(store: Store) {
  // use useState to get a method for triggering re-renders in consumer components
  const [state, setState] = useState(() => {
    // read the initial state and emit BeforeFirstUse if not yet initialized
    const fullInitialState = store.getState();
    if (!store.hasInitialized()) {
      const event = store.emit('BeforeFirstUse', fullInitialState);
      if (event.data !== fullInitialState) {
        store.mergeSync(event.data);
      }
      return event.data;
    }
    return fullInitialState;
  });

  // on first mount, save that setState method as a trigger
  useEffect(() => {
    const setter: SetterType = {
      handler: setState,
    };
    store._subscribe(setter);
    return () => store._unsubscribe(setter);
  }, [store]);

  // the entire state value will then be here to return
  return state;
}
