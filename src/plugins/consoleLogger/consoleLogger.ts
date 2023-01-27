import Store from '../../classes/Store/Store';
import { EventNameType, EventType } from '../../types';

type LoggerDataType<StateType> = {
  storeId: string;
  eventType: EventNameType;
  event: EventType<StateType, EventNameType>;
};

type LoggerConfigType<StateType> = {
  eventTypes?: EventNameType[];
  logHandler?: (message: LoggerDataType<StateType>) => {};
};

/**
 * Plugin a logger that will emit all store events to the console
 * @param eventTypes
 */
export default function consoleLogger<StateType>({
  eventTypes = ['*'],
  logHandler = console.log.bind(console),
}: LoggerConfigType<StateType> = {}) {
  return function plugin(store: Store<StateType>) {
    if (!Array.isArray(eventTypes) || eventTypes.length === 0) {
      throw new Error(
        'react-thermals: consoleLogger must receive one or more eventTypes'
      );
    }
    for (const type of eventTypes) {
      store.on(type, evt => {
        logHandler({
          storeId: store.id,
          eventType: evt.type,
          event: evt as EventType<StateType, EventNameType>,
        });
      });
    }
  };
}
