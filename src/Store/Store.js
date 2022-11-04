import Emitter from '../Emitter/Emitter.js';
import shallowCopy from '../shallowCopy/shallowCopy.js';
import shallowOverride from '../shallowOverride/shallowOverride.js';
import { updatePath } from '../updatePath/updatePath.js';
import selectPath from '../selectPath/selectPath.js';

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

  /**
   * The actions that interact with the store
   * @type {Record<string, function>}
   */
  actions = {};

  /**
   * A string to identify the store by
   * @type {String}
   */
  id;

  /**
   * Create a new store with the given state and actions
   * @param {any} initialState  The store's initial state; it can be of any type
   * @param {Record<String, Function>} actions  Named functions that can be dispatched by name and arguments
   * @param {Record<String, any>} options  Options that setters, plugins or event listeners might look for
   * @param {Boolean} autoReset  True to reset state after all components unmount
   * @param {String} id  An identifier that could be used by plugins or event listeners
   */
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

  /**
   * Return the current state of the store
   * @return {any}
   */
  getState = () => {
    return this.#_state;
  };

  /**
   * Return the current state of the store
   * @return {any}
   */
  getStateAt = path => {
    return selectPath(path)(this.#_state);
  };

  /**
   * Add functions that operate on state
   * @param {Record<String, Function>} actions
   * @return {Record<String, Function>}
   */
  addActions = actions => {
    Object.assign(this.#_rawActions, actions);
    const boundActions = {};
    for (const [name, fn] of Object.entries(actions)) {
      this.actions[name] = boundActions[name] = fn.bind(this);
    }
    return boundActions;
  };

  /**
   * Schedule state to be updated in the next batch of updates
   * @param {Function|any} newState  The new value or function that will return the new value
   * @return {Store}
   */
  setState = newState => {
    this.#_updateQueue.push(newState);
    if (this.#_updateQueue.length === 1) {
      this.#_scheduleUpdates();
    }
    return this;
  };

  /**
   * Schedule state to be merged in the next batch of updates
   * @param {Function|Object} newState  The value to merge or function that will return value to merge
   * @return {Store}
   */
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

  /**
   * Schedule state to be merged in the next batch of updates
   * @param {Object} moreState  The values to merge into the state (components will not be notified)
   * @return {Store}
   */
  extendState = moreState => {
    if (typeof moreState !== 'object' || typeof this.#_state !== 'object') {
      throw new Error(
        'react-thermals Store.extendState(): current state and given state must both be objects'
      );
    }
    // TODO: throw exception if state or moreState are not objects
    Object.assign(this.#_state, moreState);
    return this;
  };

  /**
   * Immediately update the state to the given value
   * @param {Function|any} newState  The new value or function that will return the new value
   * @return {Store}
   */
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

  /**
   * Immediately merge the state with the given value
   * @param {Function|Object} newState  The value to merge or function that will return value to merge
   * @return {Store}
   */
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

  /**
   * Schedule a value to be updated in the next batch of updates at the given path inside the state
   * @param {String} path  The path to the value
   * @param {Function|any} newStateOrUpdater  The new value or a function that receives "oldState" as a first parameter
   */
  setStateAt = (path, newStateOrUpdater) => {
    const updater = updatePath(path);
    this.setState(old => updater(old, newStateOrUpdater));
  };

  /**
   * Immediately update a value at the given path inside the state
   * @param {String} path  The path to the value
   * @param {Function|any} newStateOrUpdater  The new value or a function that receives "oldState" as a first parameter
   */
  setSyncAt = (path, newStateOrUpdater) => {
    const updater = updatePath(path);
    this.setSync(old => updater(old, newStateOrUpdater));
  };

  /**
   * Immediately apply all updates in the update queue and notify components
   * that they need to re-render. Note that React will not re-render
   * synchronously.
   * @return {any}  The resulting state
   */
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

  /**
   * Create a clone of this store, including plugins but excluding event listeners
   * @param {Object} withOverrides  Any properties you want to override
   * @property {any} initialState  The store's initial state; it can be of any type
   * @property {Record<String, Function>} actions  Named functions that can be dispatched by name and arguments
   * @property {Record<String, any>} options  Options that setters, plugins or event listeners might look for
   * @property {Boolean} autoReset  True to reset state after all components unmount
   * @property {String} id  An identifier that could be used by plugins or event listeners
   * @return {Store}
   */
  clone = (withOverrides = {}) => {
    const cloned = new Store({
      state: shallowCopy(this.#_state),
      actions: this.#_rawActions,
      autoReset: this.#_autoReset,
      options: this.#_options,
      id: this.id,
      ...withOverrides,
    });
    for (const initializer of this.#_plugins) {
      cloned.plugin(initializer);
    }
    return cloned;
  };

  /**
   * Reset a store to its initial state
   * @param {any} withOverrides  Additional state to override
   * @return {Store}
   */
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

  /**
   * Return a promise that will resolve once the store gets a new state
   * @return {Promise<any>}  Resolves with the new state  value
   */
  nextState = () => {
    return new Promise(resolve => {
      this.once('AfterUpdate', () => resolve(this.#_state));
    });
  };

  /**
   * Return the number of components that "use" this store data
   * @return {Number}
   */
  getUsedCount = () => {
    return this.#_usedCount;
  };

  /**
   * Return true if any component has ever used this store
   * @return {Boolean}
   */
  hasInitialized = () => {
    return this.#_hasInitialized;
  };

  /**
   * Return the number of *mounted* components that "use" this store
   * @return {number}
   */
  getMountCount = () => {
    return this.#_setters.length;
  };

  /**
   * Get all the store options
   * @return {Object}
   */
  getOptions = () => {
    return this.#_options;
  };

  /**
   * Get a single store option
   * @param {String} name  The name of the option
   * @return {*}
   */
  getOption = name => {
    return this.#_options[name];
  };

  /**
   * Set store options
   * @param {Object} newOptions
   * @return {Store}
   */
  setOptions = newOptions => {
    this.#_options = newOptions;
    return this;
  };

  /**
   * Set a single store option
   * @param {String} name  The name of the option
   * @param {any} newValue  The value to set
   * @return {Store}
   */
  setOption = (name, newValue) => {
    this.#_options[name] = newValue;
    return this;
  };

  /**
   * Register a plugin. Note that a handler attached to BeforePlugin can prevent the plugin from getting attached
   * @param {Function} initializer  The function the plugin uses to configure and attach itself
   * @return {Object}
   * @property {Boolean} initialized  True if the plugin was successfully registered
   * @property {any} result  The return value of the plugin initializer function
   */
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

  /**
   * Get the array of plugin initializer functions
   * @return {Array}
   */
  getPlugins = () => {
    return this.#_plugins;
  };

  /**
   * Register a middleware function
   * @param {Function} middlewares  The middleware function to register
   * @return {Store}
   */
  use = (...middlewares) => {
    this.#_middlewares.push(...middlewares);
    return this;
  };

  /**
   * Run all the registered middleware
   * @private
   * @param {Object} context  Object with prev, next, isAsync, store
   * @param {Function} callback  The function to call when all middlewares have called "next()"
   */
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

  /**
   * Run all the registered middleware synchronously. Any middleware that does not
   * immediately call "next()" will cancel the update
   * @private
   * @param {Object} context  Object with prev, next, isAsync, store
   */
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

  /**
   * Connect a component to the store so that when relevant state changes, the component will be re-rendered
   * @param {Function} setState  A setState function from React.useState()
   * @note private but used by useStoreSelector()
   */
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

  /**
   * Disconnect a component from the store
   * @param {Function} setState  The setState function used to _subscribe
   * @note private but used by useStoreSelector()
   */
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

  /**
   * Get a function that will tell connected components to re-render
   * @param {any} prev  The previous state value
   * @param {any} next  The next state value
   * @return {Function<Function>}
   */
  #_getComponentUpdater = (prev, next) => {
    return function _maybeSetState(setter) {
      if (typeof setter.mapState === 'function') {
        // registered from useStoreSelector so only re-render
        // components when the relevant slice of state changes
        const prevSelected = setter.mapState(prev);
        const nextSelected = setter.mapState(next);
        if (!setter.equalityFn(prevSelected, nextSelected)) {
          // the slice of state is not equal so rerender component
          setter(nextSelected);
        }
      } else {
        // registered from useStoreState
        setter(next);
      }
    };
  };

  /**
   * Process the update queue and return a Promise that resolves to the new state
   * @return {Promise<any>}
   */
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

  /**
   * Schedule updates for the next tick
   */
  #_scheduleUpdates = () => {
    // Use Promise to queue state update for next tick
    // see https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/queueMicrotask
    Promise.resolve()
      .then(this.#_runUpdates)
      .catch(err => this.emit('SetterException', err));
  };

  /**
   * Run all queued updates and return a Promise that resolves to the new state
   * @return {Promise<any>}
   */
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

  /**
   * Tell connected components to re-render if applicable
   * @param {any} prev  The previous state value
   * @param {any} next  The new state value
   */
  #_notifyComponents = (prev, next) => {
    // save final state result
    this.#_state = next;
    // update components with no selector or with matching selector
    this.#_setters.forEach(this.#_getComponentUpdater(prev, this.#_state));
    // announce the final state
    this.emit('AfterUpdate', { prev, next: this.#_state });
  };

  /**
   * Process the update queue synchronously and return the new state
   * Note that any updater functions that return promises will be queued for later update.
   * @return {any}  The new state OR the previous state if updating was blocked
   */
  #_getNextStateSync = () => {
    let prev = this.#_state;
    let next = this.#_state;
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
        const maybeNext = updatedState(next);
        if (typeof maybeNext?.then === 'function') {
          // we want to call all state mutator functions synchronously
          // but we have a mutator that returned a Promise so we need
          // to circle back and set state after the Promise resolves
          maybeNext
            .then(this.setState)
            .catch(err => this.emit('SetterException', err));
        } else {
          next = maybeNext;
        }
      } else {
        next = updatedState;
      }
    }
    const context = {
      prev,
      next,
      isAsync: false,
      store: this,
    };
    const shouldContinue = this.#_runMiddlewaresSync(context);
    if (shouldContinue) {
      return context.next;
    } else {
      return prev;
    }
  };
}
