//
// .subscribe()
// call next(newState)
//
export default function observable() {
  return function plugin(store) {
    const lookup = new Map();
    store.subscribe = function (observer) {
      const handler = event => {
        observer.next(event.data.next);
      };
      lookup.set(observer, handler);
      store.on('AfterUpdate', handler);
    };
    store.unsubscribe = function (observer) {
      const handler = lookup.get(observer);
      if (handler) {
        lookup.delete(observer);
        store.off('AfterUpdate', handler);
      }
    };
    store.on('AfterLastUnmount', () => {
      for (const observer of lookup.keys()) {
        observer.complete();
      }
    });
    // asObserveable?
  };
}
