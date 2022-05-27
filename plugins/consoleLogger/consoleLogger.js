export default function consoleLogger(eventTypes = ['*']) {
  return function plugin(store) {
    for (const type of eventTypes) {
      store.on(type, evt => {
        console.log({ storeId: store.id, eventType: evt.type, event: evt });
      });
    }
  };
}

consoleLogger.name = 'consoleLogger';
