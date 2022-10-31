import { useState, useEffect, useMemo } from 'react';

/**
 * @param {Store} store - An instance of Store
 * @return {Object} - The entire state value that will rerender the host
 *   Component when the state value changes
 */
export default function useStoreState(store) {
  // derive the initial state, in case plugins are injecting initial state
  const initialState = useMemo(() => {
    const initialState = store.getState();
    if (store.getMountCount() === 0) {
      const event = store.emit('BeforeInitialState', initialState);
      if (event.data !== initialState) {
        store.setSync(event.data);
      }
      return event.data;
    }
    return initialState;
  }, [store]);

  // use useState to get a method for triggering rerenders in consumer components
  const [state, setState] = useState(initialState);

  // on first mount, save that setState method as a trigger
  useEffect(() => {
    store._subscribe(setState);
    return () => store._unsubscribe(setState);
  }, [store, setState]);

  // return the current state
  return state;
}
