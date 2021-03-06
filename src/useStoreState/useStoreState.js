import { useState, useEffect, useMemo } from 'react';

/**
 * @param {Object} store - A store created with createStore()
 * @return {Object} - tools for working with the store
 * @property {*} state - The value in the store
 * @property {Object} actions - functions defined by createStore
 * @property {Function} reset - function to reset the store's state to its initial value
 * @property {Function} nextState - function that returns a Promise that resolves on next state value
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
