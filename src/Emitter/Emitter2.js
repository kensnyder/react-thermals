import PreventableEvent from '../PreventableEvent/PreventableEvent.js';

export default class Emitter2 {
  #_handlers = {
    '*': [],
  };

  on(type, handler) {
    if (!this.#_handlers[type]) {
      this.#_handlers[type] = [];
    }
    this.#_handlers[type].push(handler);
    return this;
  }

  off(type, handler) {
    if (!this.#_handlers[type]) {
      this.#_handlers[type] = [];
    }
    this.#_handlers[type] = this.#_handlers[type].filter(h => h !== handler);
    return this;
  }

  once(type, handler) {
    const onceHandler = event => {
      this.off(type, onceHandler);
      handler.call(this, event);
    };
    this.on(type, onceHandler);
    return this;
  }

  emit(type, data = null) {
    if (
      (!this.#_handlers[type] || this.#_handlers[type].length === 0) &&
      this.#_handlers['*'].length === 0
    ) {
      return { type, data };
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
