import { useState, useEffect } from 'react';
import { SetterType } from '../Store/Setter.type';
import Store from '../Store/Store';

/**
 * @param {Store} store - An instance of Store
 * @return {Object} - The entire state value that will rerender the host
 *   Component when the state value changes
 */
export default function useStoreState(store: Store) {
  // use useState to get a method for triggering re-renders in consumer components
  const [state, setState] = useState(() => {
    // derive the initial state, if different because of mapState or equalityFn
    const fullInitialState = store.getState();
    if (!store.hasInitialized()) {
      const event = store.emit('BeforeInitialState', fullInitialState);
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

  // return that slice or whole bit of state
  return state;
}
