import {
  EventHandlerType,
  EventNameType,
  EventType,
  EventDataType,
} from '../../types';

export default class SimpleEmitter<StateType> {
  #_handlers: Record<string, EventHandlerType<StateType, EventNameType>[]> = {
    '*': [],
  };

  /**
   * Add an event listener
   * @param type  The event name
   * @param  handler  The function to be called when the event fires
   * @return  The emitter instance
   */
  on = <EventName extends EventNameType>(
    type: EventName,
    handler: EventHandlerType<StateType, EventName>
  ) => {
    if (!this.#_handlers[type]) {
      this.#_handlers[type] = [];
    }
    this.#_handlers[type].push(handler);
    return this;
  };

  /**
   * Remove an event listener
   * @param type  The event name
   * @param handler  The function registered with "on()" or "once()"
   * @return  The emitter instance
   */
  off = <EventName extends EventNameType>(
    type: EventName,
    handler: EventHandlerType<StateType, EventName>
  ) => {
    if (!this.#_handlers[type]) {
      this.#_handlers[type] = [];
    }
    this.#_handlers[type] = this.#_handlers[type].filter(h => h !== handler);
    return this;
  };

  /**
   * Add an event listener that should fire once and only once
   * @param type  The event name
   * @param handler  The function to be called when the event fires
   * @return  The emitter instance
   */
  once = <EventName extends EventNameType>(
    type: EventName,
    handler: EventHandlerType<StateType, EventName>
  ) => {
    const onceHandler = (event: EventType<StateType, EventName>) => {
      this.off(type, onceHandler);
      handler.call(this, event);
    };
    this.on(type, onceHandler);
    return this;
  };

  /**
   * Trigger handlers attached to the given event with the given data
   * @param type  The event name
   * @param data  The data to pass to evt.data
   */
  emit = <EventName extends EventNameType>(
    type: EventName,
    data: EventDataType<StateType, EventName> = undefined
  ): EventType<StateType, EventName> => {
    const event = { target: this, type, data };
    if (this.#_handlers['*'].length > 0) {
      // run callbacks registered to both "*" and "type"
      for (const handler of this.#_handlers['*']) {
        handler.call(this, event);
      }
    }
    if (this.#_handlers[type]?.length > 0) {
      // run callbacks registered to both "*" and "type"
      for (const handler of this.#_handlers[type]) {
        handler.call(this, event);
      }
    }
    return event;
  };
}
