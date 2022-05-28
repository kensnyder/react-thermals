import PreventableEvent from '../PreventableEvent/PreventableEvent.js';

export default class Emitter {
  constructor(context = null) {
    this._handlers = {
      '*': [],
    };
    this._context = context || this;
  }

  on(type, handler) {
    if (!this._handlers[type]) {
      this._handlers[type] = [];
    }
    this._handlers[type].push(handler);
    return this._context;
  }

  off(type, handler) {
    if (!this._handlers[type]) {
      this._handlers[type] = [];
    }
    this._handlers[type] = this._handlers[type].filter(h => h !== handler);
    return this._context;
  }

  once(type, handler) {
    const onceHandler = event => {
      this.off(type, onceHandler);
      handler.call(this._context, event);
    };
    this.on(type, onceHandler);
    return this._context;
  }

  emit(type, data = null) {
    if (
      (!this._handlers[type] || this._handlers[type].length === 0) &&
      this._handlers['*'].length === 0
    ) {
      return { type, data };
    }
    const event = new PreventableEvent(this._context, type, data);
    // run callbacks registered to both "*" and "type"
    const handlers = [...this._handlers['*'], ...(this._handlers[type] || [])];
    for (const handler of handlers) {
      handler.call(this._context, event);
      if (event.propagationStopped) {
        break;
      }
    }
    return event;
  }
}
