import PreventableEvent from '../PreventableEvent/PreventableEvent';
import { EventHandlerType, EventNameType } from '../../types';

export default class Emitter {
  #_handlers: Record<string, EventHandlerType[]> = {
    '*': [],
  };

  /**
   * Add an event listener
   * @param type  The event name
   * @param  handler  The function to be called when the event fires
   * @return  The emitter instance
   */
  on(type: EventNameType, handler: EventHandlerType): Emitter {
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
  off(type: EventNameType, handler: EventHandlerType): Emitter {
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
  once(type: EventNameType, handler: EventHandlerType): Emitter {
    const onceHandler = (event: PreventableEvent) => {
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
   * @return  The event object that was passed to handlers
   * @property isDefaultPrevented  Read to tell if event was canceled
   */
  emit(type: EventNameType, data: any = null): PreventableEvent {
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
