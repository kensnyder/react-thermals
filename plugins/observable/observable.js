//
// Usage:
// store.plugin(observable());
//
// Add subscribe method to the state:
// .subscribe(observer) OR
// .subscribe(next, error, complete)
//
// That subscribe method returns an object with an unsubscribe method
//
// Subscribed observers will be notified on 3 events:
// 1. After store enters new state      => .next(state)
// 2. After last consumer unmounts      => .complete()
// 3. When setter function throws error => .error(error)
//
export default function observable() {
  return function plugin(store) {
    const observers = [];
    store.subscribe = function subscribe(...args) {
      let observer;
      if (typeof args[0] === 'function') {
        const [next, error, complete] = args;
        observer = {
          next,
          error,
          complete,
        };
      } else {
        observer = args[0];
      }
      observers.push(observer);
      const subscription = {
        unsubscribe() {
          const idx = observers.indexOf(observer);
          if (idx > -1) {
            observers.splice(idx, 1);
          }
        },
      };
      return subscription;
    };
    store.on('AfterUpdate', event => {
      for (const observer of observers) {
        observer.next(event.data.next);
      }
    });
    store.on('AfterLastUnmount', () => {
      for (const observer of observers) {
        observer.complete?.();
      }
    });
    store.on('SetterException', event => {
      for (const observer of observers) {
        observer.error?.(event.data);
      }
    });
  };
}
