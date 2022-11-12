import Store from '../../class/Store/Store';
import PreventableEvent from '../../class/PreventableEvent/PreventableEvent';
import { EventNameType } from '../../types';

export default function consoleLogger({ eventTypes = ['*'] } = {}) {
  return function plugin(store: Store) {
    if (!Array.isArray(eventTypes) || eventTypes.length === 0) {
      throw new Error(
        'react-thermals: consoleLogger must receive one or more eventTypes'
      );
    }
    store.once('AfterPlugin', () => {
      // attach listeners, but only after this plugin is registered
      for (const type of eventTypes) {
        store.on(type as EventNameType, (evt: PreventableEvent) => {
          console.log({ storeId: store.id, eventType: evt.type, event: evt });
        });
      }
    });
  };
}
