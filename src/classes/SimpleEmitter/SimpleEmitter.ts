import type { EventHandlerType, EventType, EventDataType } from '../../types';

export default class SimpleEmitter<StateType, KnownEventNames extends string> {
  #_handlers: Partial<
    Record<KnownEventNames, EventHandlerType<StateType, KnownEventNames>[]>
  > = {};

  /**
   * Add an event listener
   * @param type  The event name
   * @param  handler  The function to be called when the event fires
   * @return  The emitter instance
   */
  on = <EventName extends KnownEventNames>(
    type: EventName,
    handler: EventHandlerType<StateType, KnownEventNames>
  ) => {
    if (!this.#_handlers[type]) {
      this.#_handlers[type] = [];
    }
    this.#_handlers[type].push(handler);
    return this;
  };

  /**
   * Check if the given event name has any handlers
   * @param type  The event name
   * @return  True if there are any handlers registered
   */
  hasSubscriber = (type: KnownEventNames) => {
    return this.#_handlers[type]?.length || this.#_handlers['*']?.length;
  };

  /**
   * Remove an event listener
   * @param type  The event name
   * @param handler  The function registered with "on()" or "once()"
   * @return  The emitter instance
   */
  off = <EventName extends KnownEventNames>(
    type: EventName,
    handler: EventHandlerType<StateType, KnownEventNames>
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
  once = <EventName extends KnownEventNames>(
    type: EventName,
    handler: EventHandlerType<StateType, KnownEventNames>
  ) => {
    const onceHandler = event => {
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
  emit = <EventName extends KnownEventNames>(
    type: EventName,
    data: EventDataType<StateType, EventName> = undefined
  ): EventType<StateType, KnownEventNames> => {
    const event = { target: this, type, data };
    if (this.#_handlers['*']?.length > 0) {
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
