import Store from '../../classes/Store/Store';
import { KnownEventNames, EventType } from '../../types';

type LoggerDataType<StateType> = {
  storeId: string;
  eventType: KnownEventNames;
  event: EventType<StateType, KnownEventNames>;
};

type LoggerConfigType<StateType> = {
  eventTypes?: KnownEventNames[];
  logHandler?: (message: LoggerDataType<StateType>) => void;
};

/**
 * Plugin a logger that will emit all store events to the console
 * @param eventTypes
 * @param logHandler  The function that will actually log
 */
export default function consoleLogger<StateType>({
  eventTypes = ['*'],
  logHandler = console.log as (message: LoggerDataType<StateType>) => void,
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
          event: evt as EventType<StateType, KnownEventNames>,
        });
      });
    }
  };
}
