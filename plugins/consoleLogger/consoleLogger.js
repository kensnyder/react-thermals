export default function consoleLogger(eventTypes = ['*']) {
  return function plugin(store) {
    for (const type of eventTypes) {
      store.on(type, evt => {
        console.log(store.id, evt.type, evt);
      });
    }
  };
}
