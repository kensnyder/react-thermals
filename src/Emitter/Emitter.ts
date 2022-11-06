import PreventableEvent from '../PreventableEvent/PreventableEvent';

export default class Emitter {
  #_handlers: Record<string, Function>[] = {
    '*': [],
  };

  /**
   * Add an event listener
   * @param {String} type  The event name
   * @param {Function} handler  The function to be called when the event fires
   * @return {Emitter}
   */
  on(type: string, handler: Function): Emitter {
    if (!this.#_handlers[type]) {
      this.#_handlers[type] = [];
    }
    this.#_handlers[type].push(handler);
    return this;
  }

  /**
   * Remove an event listener
   * @param {String} type  The event name
   * @param {Function} handler  The function registered with "on()" or "once()"
   * @return {Emitter}
   */
  off(type: string, handler: Function): Emitter {
    if (!this.#_handlers[type]) {
      this.#_handlers[type] = [];
    }
    this.#_handlers[type] = this.#_handlers[type].filter(h => h !== handler);
    return this;
  }

  /**
   * Add an event listener that should fire once and only once
   * @param {String} type  The event name
   * @param {Function} handler  The function to be called when the event fires
   * @return {Emitter}
   */
  once(type: string, handler: Function): Emitter {
    const onceHandler = (event: PreventableEvent) => {
      this.off(type, onceHandler);
      handler.call(this, event);
    };
    this.on(type, onceHandler);
    return this;
  }

  /**
   * Trigger handlers attached to the given event with the given data
   * @param {String} type  The event name
   * @param {any} data  The data to pass to evt.data
   * @return {PreventableEvent}  Returns the event object that was passed to handlers
   * @property isDefaultPrevented  Read to tell if event was canceled
   */
  emit(type: string, data: any = null): PreventableEvent {
    if (
      (!this.#_handlers[type] || this.#_handlers[type].length === 0) &&
      this.#_handlers['*'].length === 0
    ) {
      return new PreventableEvent(this, type, data);
    }
    const event = new PreventableEvent(this, type, data);
    // run callbacks registered to both "*" and "type"
    const handlers = [
      ...this.#_handlers['*'],
      ...(this.#_handlers[type] || []),
    ];
    for (const handler of handlers) {
      handler.call(this, event);
      if (event.propagationStopped) {
        break;
      }
    }
    return event;
  }
}
