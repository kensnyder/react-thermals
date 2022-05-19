//
// TO USE:
// store.plugin(persistState(localStorage));
// OR
// store.plugin(persistState(sessionStorage));
//
export default function persistState(storage) {
  if (
    !storage ||
    typeof storage.getItem !== 'function' ||
    typeof storage.setItem !== 'function'
  ) {
    throw new Error(
      'react-thermals: persistState plugin must receive a storage object such as localStorage or sessionStorage'
    );
  }
  return function plugin(store) {
    store.on('BeforeInitialState', () => {
      const initial = storage.getItem(store.id);
      if (initial) {
        store.setSync(initial);
      }
    });
    store.on('AfterUpdate', ({ data: { next } }) => {
      storage.setItem(store.id, next);
    });
  };
}
