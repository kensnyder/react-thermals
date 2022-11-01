import useStoreSelector from '../useStoreSelector/useStoreSelector.js';

/**
 * @param {Store} store - An instance of Store
 * @return {Object} - The entire state value that will rerender the host
 *   Component when the state value changes
 */
export default function useStoreState(store) {
  return useStoreSelector(store, state => state);
}
