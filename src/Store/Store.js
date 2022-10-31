import Emitter from '../Emitter/Emitter.js';
import shallowCopy from '../shallowCopy/shallowCopy.js';
import shallowOverride from '../shallowOverride/shallowOverride.js';

// an internal counter for stores
let storeIdx = 1;

export default class Store extends Emitter {
  #_autoReset;
  #_hasInitialized = false;
  #_idx;
  #_initialState;
  #_middlewares = [];
  #_options;
  #_plugins = [];
  #_rawActions = {};
  #_setters = [];
  #_state;
  #_updateQueue = [];
  #_usedCount = 0;
  actions = {};
  id;
  constructor({
    state: initialState = {},
    actions = {},
    options = {},
    autoReset = false,
    id = null,
  } = {}) {
    super();
    this.once('BeforeInitialState', () => {
      this.#_hasInitialized = true;
    });
    this.#_initialState = initialState;
    this.#_state = initialState;
    this.id = String(id || `store-${storeIdx}`);
    this.#_idx = storeIdx++;
    this.addActions(actions);
    this.#_options = options;
    this.#_autoReset = autoReset;
  }
  getState = () => {
    return this.#_state;
  };
  addActions = actions => {
    Object.assign(this.#_rawActions, actions);
    for (const [name, fn] of Object.entries(actions)) {
      this.actions[name] = fn.bind(this);
    }
    return this;
  };
  setState = newState => {
    this.#_updateQueue.push(newState);
    if (this.#_updateQueue.length === 1) {
      this.#_scheduleUpdates();
    }
    return this;
  };
  mergeSync = newState => {
    if (typeof newState === 'function') {
      newState = newState(this.#_state);
    }
    if (typeof newState?.then === 'function') {
      throw new Error(
        'react-thermals: Error - when calling mergeSync, state updaters may not return a promise'
      );
    }
    this.#_state = shallowOverride(this.#_state, newState);
  };
  setSync = newState => {
    if (typeof newState === 'function') {
      newState = newState(this.#_state);
    }
    if (typeof newState?.then === 'function') {
      throw new Error(
        'react-thermals: Error - when calling setSync, state updaters may not return a promise'
      );
    }
    this.#_state = newState;
    return this;
  };
  mergeState = newState => {
    let updater;
    if (typeof newState === 'function') {
      updater = old => {
        const partial = newState(old);
        if (typeof partial?.then === 'function') {
          return partial.then(promisedState =>
            shallowOverride(old, promisedState)
          );
        }
        return shallowOverride(old, partial);
      };
    } else {
      updater = old => shallowOverride(old, newState);
    }
    this.#_updateQueue.push(updater);
    if (this.#_updateQueue.length === 1) {
      this.#_scheduleUpdates();
    }
    return this;
  };
  flushSync = () => {
    const prevState = this.#_state;
    const event1 = this.emit('BeforeSet', prevState);
    if (event1.defaultPrevented) {
      // handler wants to block running state updaters
      this.#_updateQueue.length = 0;
      return prevState;
    }
    let nextState;
    try {
      nextState = this.#_getNextStateSync();
    } catch (err) {
      this.emit('SetterException', err);
      return prevState;
    }
    const event2 = this.emit('BeforeUpdate', {
      prev: prevState,
      next: nextState,
    });
    if (event2.defaultPrevented) {
      // handler wants to block saving new state
      return prevState;
    }
    // save final state result (a handler may have altered the final result)
    // then notify affected components
    this.#_notifyComponents(prevState, event2.data.next);
    // _notifyComponents sets _state
    // and we return it here for convenience
    return this.#_state;
  };
  clone = (overrides = {}) => {
    const cloned = new Store({
      state: shallowCopy(this.#_state),
      actions: this.#_rawActions,
      autoReset: this.#_autoReset,
      options: this.#_options,
      id: this.id,
      ...overrides,
    });
    for (const initializer of this.#_plugins) {
      cloned.plugin(initializer);
    }
    return cloned;
  };
  reset = (withOverrides = undefined) => {
    const current = this.#_state;
    const event = this.emit('BeforeReset', {
      before: current,
      after: shallowOverride(this.#_initialState, withOverrides),
    });
    if (event.defaultPrevented) {
      return this;
    }
    this.setState(event.data.after);
    this.emit('AfterReset', {
      before: current,
      after: event.data.after,
    });
    return this;
  };
  nextState = () => {
    return new Promise(resolve => {
      this.once('AfterUpdate', () => resolve(this.#_state));
    });
  };
  getUsedCount = () => {
    return this.#_usedCount;
  };
  hasInitialized = () => {
    return this.#_hasInitialized;
  };
  getMountCount = () => {
    return this.#_setters.length;
  };
  getOptions = () => {
    return this.#_options;
  };
  getOption = name => {
    return this.#_options[name];
  };
  setOptions = newOptions => {
    this.#_options = newOptions;
    return this;
  };
  setOption = (name, newValue) => {
    this.#_options[name] = newValue;
    return this;
  };
  plugin = initializer => {
    const event = this.emit('BeforePlugin', initializer);
    if (event.defaultPrevented) {
      return { initialized: false, result: null };
    }
    const result = initializer(this);
    this.#_plugins.push(initializer);
    this.emit('AfterPlugin', { initializer, result });
    return { initialized: true, result };
  };
  getPlugins = () => {
    return this.#_plugins;
  };
  use = (...middlewares) => {
    this.#_middlewares.push(...middlewares);
    return this;
  };
  #_runMiddlewares = (context, callback) => {
    let i = 0;
    const next = () => {
      if (i === this.#_middlewares.length) {
        callback();
      } else {
        this.#_middlewares[i++](context, next);
      }
    };
    next();
  };
  #_runMiddlewaresSync = context => {
    let i = 0;
    const timesCalled = () => i++;
    for (const middleware of this.#_middlewares) {
      const lastI = i;
      middleware(context, timesCalled);
      if (lastI === i) {
        // middleware did not call "next"
        return false;
      }
    }
    return true;
  };
  _subscribe = setState => {
    if (this.#_usedCount++ === 0) {
      this.emit('AfterFirstUse');
    }
    if (this.#_setters.length === 0) {
      this.emit('AfterFirstMount');
    }
    if (this.#_setters.indexOf(setState) === -1) {
      this.#_setters.push(setState);
      this.emit('AfterMount');
    }
  };
  _unsubscribe = setState => {
    const idx = this.#_setters.indexOf(setState);
    if (idx > -1) {
      this.#_setters.splice(idx, 1);
    }
    this.emit('AfterUnmount');
    if (this.#_setters.length === 0) {
      if (this.#_autoReset) {
        this.reset();
      }
      this.emit('AfterLastUnmount');
    }
  };
  #_getComponentUpdater = (prev, next) => {
    return function _maybeSetState(setter) {
      if (typeof setter.mapState === 'function') {
        // component wants only a slice of state
        const prevSelected = setter.mapState(prev);
        const nextSelected = setter.mapState(next);
        if (!setter.equalityFn(prevSelected, nextSelected)) {
          // the slice of state is not equal so rerender component
          setter(nextSelected);
        }
      } else {
        // no mapState; always rerender component
        setter(next);
      }
    };
  };
  #_getNextState = async () => {
    let nextState = this.#_state;
    // process all updates or update functions
    // use while and shift in case setters trigger more setting
    const failsafeCascadeCount = 100;
    let failsafe = this.#_updateQueue.length + failsafeCascadeCount;
    while (this.#_updateQueue.length > 0) {
      /* istanbul ignore next */
      if (--failsafe === 0) {
        throw new Error(
          `react-thermals: Too many setState calls in queue; you probably have an infinite loop.`
        );
      }
      const updatedState = this.#_updateQueue.shift();
      if (typeof updatedState === 'function') {
        const maybeNext = updatedState(nextState);
        if (typeof maybeNext?.then === 'function') {
          try {
            nextState = await maybeNext;
          } catch (rejection) {
            this.emit('SetterException', rejection);
          }
        } else {
          nextState = maybeNext;
        }
      } else {
        nextState = updatedState;
      }
    }
    return nextState;
  };
  #_scheduleUpdates = () => {
    // Use Promise to queue state update for next tick
    // see https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/queueMicrotask
    Promise.resolve()
      .then(this.#_runUpdates)
      .catch(err => this.emit('SetterException', err));
  };
  #_runUpdates = async () => {
    const prevState = this.#_state;
    const event1 = this.emit('BeforeSet', prevState);
    if (event1.defaultPrevented) {
      // handler wants to block running state updaters
      this.#_updateQueue.length = 0;
      return;
    }
    const nextState = await this.#_getNextState();
    const context = {
      prev: prevState,
      next: nextState,
      isAsync: true,
      store: this,
    };
    const event2 = this.emit('BeforeUpdate', context);
    if (event2.defaultPrevented) {
      // handler wants to block setting new state
      return;
    }
    this.#_runMiddlewares(context, () => {
      // save final state result (a handler may have altered the final result)
      // then notify affected components
      this.#_notifyComponents(prevState, context.next);
    });
  };
  #_notifyComponents = (prevState, data) => {
    // save final state result
    this.#_state = data;
    // update components with no selector or with matching selector
    this.#_setters.forEach(this.#_getComponentUpdater(prevState, this.#_state));
    // announce the final state
    this.emit('AfterUpdate', { prev: prevState, next: this.#_state });
  };
  #_getNextStateSync = () => {
    let prevState = this.#_state;
    let nextState = this.#_state;
    // process all updates or update functions
    // use while and shift in case setters trigger more setting
    const failsafeCascadeCount = 100;
    let failsafe = this.#_updateQueue.length + failsafeCascadeCount;
    while (this.#_updateQueue.length > 0) {
      /* istanbul ignore next */
      if (--failsafe === 0) {
        throw new Error(
          `react-thermals: Too many setState calls in queue; probably an infinite loop.`
        );
      }
      const updatedState = this.#_updateQueue.shift();
      if (typeof updatedState === 'function') {
        const maybeNext = updatedState(nextState);
        if (typeof maybeNext?.then === 'function') {
          // we want to call all state mutator functions synchronously
          // but we have a mutator that returned a Promise so we need
          // to circle back and set state after the Promise resolves
          maybeNext
            .then(this.setState)
            .catch(err => this.emit('SetterException', err));
        } else {
          nextState = maybeNext;
        }
      } else {
        nextState = updatedState;
      }
    }
    const context = {
      prev: prevState,
      next: nextState,
      isAsync: false,
      store: this,
    };
    const shouldContinue = this.#_runMiddlewaresSync(context);
    if (shouldContinue) {
      return context.next;
    } else {
      return prevState;
    }
  };
}
