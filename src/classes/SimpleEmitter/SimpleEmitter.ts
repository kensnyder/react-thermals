import { EventHandlerType, EventNameType, EventType } from '../../types';

export default class SimpleEmitter {
  #_handlers: Record<string, EventHandlerType[]> = {
    '*': [],
  };

  /**
   * Add an event listener
   * @param type  The event name
   * @param  handler  The function to be called when the event fires
   * @return  The emitter instance
   */
  on(type: EventNameType, handler: EventHandlerType): SimpleEmitter {
    if (!this.#_handlers[type]) {
      this.#_handlers[type] = [];
    }
    this.#_handlers[type].push(handler);
    return this;
  }

  /**
   * Remove an event listener
   * @param type  The event name
   * @param handler  The function registered with "on()" or "once()"
   * @return  The emitter instance
   */
  off(type: EventNameType, handler: EventHandlerType): SimpleEmitter {
    if (!this.#_handlers[type]) {
      this.#_handlers[type] = [];
    }
    this.#_handlers[type] = this.#_handlers[type].filter(h => h !== handler);
    return this;
  }

  /**
   * Add an event listener that should fire once and only once
   * @param type  The event name
   * @param handler  The function to be called when the event fires
   * @return  The emitter instance
   */
  once(type: EventNameType, handler: EventHandlerType): SimpleEmitter {
    const onceHandler = (event: EventType) => {
      this.off(type, onceHandler);
      handler.call(this, event);
    };
    this.on(type, onceHandler);
    return this;
  }

  /**
   * Trigger handlers attached to the given event with the given data
   * @param type  The event name
   * @param data  The data to pass to evt.data
   */
  emit(type: EventNameType, data: any = null) {
    if (
      (!this.#_handlers[type] || this.#_handlers[type].length === 0) &&
      this.#_handlers['*'].length === 0
    ) {
      return;
    }
    const event = { target: this, type, data };
    // run callbacks registered to both "*" and "type"
    const handlers = [
      ...this.#_handlers['*'],
      ...(this.#_handlers[type] || []),
    ];
    for (const handler of handlers) {
      handler.call(this, event);
    }
  }
}
