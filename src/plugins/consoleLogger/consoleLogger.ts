import Store from '../../classes/Store/Store';
import { EventNameType, EventType } from '../../types';

type LoggerDataType = {
  storeId: string;
  eventType: EventNameType;
  event: EventType;
};

type LoggerConfigType = {
  eventTypes?: EventNameType[];
  logHandler?: (message: LoggerDataType) => {};
};

/**
 * Plugin a logger that will emit all store events to the console
 * @param eventTypes
 */
export default function consoleLogger({
  eventTypes = ['*'],
  logHandler = console.log.bind(console),
}: LoggerConfigType = {}) {
  return function plugin(store: Store) {
    if (!Array.isArray(eventTypes) || eventTypes.length === 0) {
      throw new Error(
        'react-thermals: consoleLogger must receive one or more eventTypes'
      );
    }
    for (const type of eventTypes) {
      store.on(type as EventNameType, evt => {
        logHandler({
          storeId: store.id,
          eventType: evt.type as EventNameType,
          event: evt,
        });
      });
    }
  };
}
