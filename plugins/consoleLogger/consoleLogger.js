export default function consoleLogger({ eventTypes = ['*'] } = {}) {
  return function plugin(store) {
    if (!Array.isArray(eventTypes) || eventTypes.length === 0) {
      throw new Error(
        'react-thermals: consoleLogger must receive one or more eventTypes'
      );
    }
    store.once('AfterPlugin', () => {
      // attach listeners, but only after this plugin is registered
      for (const type of eventTypes) {
        store.on(type, evt => {
          console.log({ storeId: store.id, eventType: evt.type, event: evt });
        });
      }
    });
  };
}
