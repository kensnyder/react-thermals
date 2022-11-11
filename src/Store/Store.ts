import Emitter from '../Emitter/Emitter';
import shallowCopy from '../shallowCopy/shallowCopy';
import shallowOverride from '../shallowOverride/shallowOverride';
import { updatePath } from '../updatePath/updatePath';
import selectPath from '../selectPath/selectPath';
import {
  StoreConfigType,
  SetterType,
  EventNameType,
  MergeableStateAsyncType,
  MergeableStateType,
  MiddlewareContextInterface,
  PlainObjectType,
  PluginResultType,
  PluginFunctionType,
  EventHandlerType,
} from '../types';

// an internal counter for stores
let storeIdx = 1;

export default class Store extends Emitter {
  #_autoReset: boolean;
  #_hasInitialized = false;
  #_idx: number;
  #_initialState: any;
  #_middlewares: Function[] = [];
  #_options: PlainObjectType;
  #_plugins: PluginFunctionType[] = [];
  #_rawActions: Record<string, Function> = {};
  #_setters: SetterType[] = [];
  #_state: any;
  #_updateQueue: Function[] = [];
  #_usedCount = 0;

  /**
   * The actions that interact with the store
   */
  actions: Record<string, Function> = {};

  /**
   * A string to identify the store by
   */
  id: string;

  /**
   * Create a new store with the given state and actions
   * @param initialState  The store's initial state; it can be of any type
   * @param actions  Named functions that can be dispatched by name and arguments
   * @param options  Options that setters, plugins or event listeners might look for
   * @param on  One or more handlers to add immediately
   * @param autoReset  True to reset state after all components unmount
   * @param id  An identifier that could be used by plugins or event listeners
   */
  constructor({
    state: initialState = {},
    actions = {},
    options = {},
    on = {},
    autoReset = false,
    id = '',
  }: StoreConfigType = {}) {
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
    for (const [event, handlerOrHandlers] of Object.entries(on)) {
      for (const handler of [handlerOrHandlers].flat()) {
        this.on(event as EventNameType, handler as EventHandlerType);
      }
    }
  }

  /**
   * Return the current state of the store
   * @return {any}
   */
  getState = (): any => {
    return this.#_state;
  };

  /**
   * Return the current state of the store
   */
  getStateAt = (path: string): any => {
    return selectPath(path)(this.#_state);
  };

  /**
   * Add functions that operate on state
   * @param actions
   * @return The actions after binding "this" to "Store"
   */
  addActions = (
    actions: Record<string, Function>
  ): Record<string, Function> => {
    Object.assign(this.#_rawActions, actions);
    const boundActions: Record<string, Function> = {};
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
  setState = (newState: any) => {
    this.#_updateQueue.push(newState);
    if (this.#_updateQueue.length === 1) {
      this.#_scheduleUpdates();
    }
    return this;
  };

  /**
   * Schedule state to be merged in the next batch of updates
   * @param newState  The value to merge or function that will return value to merge
   * @chainable
   */
  mergeState = (newState: MergeableStateAsyncType) => {
    let updater;
    if (typeof newState === 'function') {
      updater = (old: Record<string, any>) => {
        const partial = newState(old);
        if (typeof partial?.then === 'function') {
          return partial.then((promisedState: Object) =>
            shallowOverride(old, promisedState)
          );
        }
        return shallowOverride(old, partial);
      };
    } else {
      updater = (old: Record<string, any>) => shallowOverride(old, newState);
    }
    this.#_updateQueue.push(updater);
    if (this.#_updateQueue.length === 1) {
      this.#_scheduleUpdates();
    }
    return this;
  };

  /**
   * Schedule state to be merged in the next batch of updates
   * @param moreState The values to merge into the state (components will not be notified)
   */
  extendState = (moreState: PlainObjectType) => {
    if (typeof moreState !== 'object' || typeof this.#_state !== 'object') {
      throw new Error(
        'react-thermals Store.extendState(moreState): current state and given state must both be objects'
      );
    }
    Object.assign(this.#_state, moreState);
    return this;
  };

  /**
   * Schedule state to be merged in the next batch of updates
   * @param moreState The values to merge into the state (components will not be notified)
   */
  extendStateAt = (path: string, moreState: PlainObjectType) => {
    if (typeof moreState !== 'object') {
      throw new Error(
        'react-thermals Store.extendStateAt(path, moreState): given state must an object'
      );
    }
    const target = selectPath(path)(this.#_state);
    if (typeof target !== 'object') {
      throw new Error(
        'react-thermals Store.extendStateAt(path, moreState): state at path must be an object'
      );
    }
    Object.assign(target, moreState);
    return this;
  };

  /**
   * Immediately update the state to the given value
   * @param newState The new value or function that will return the new value
   */
  setSync = (newState: any) => {
    this.setState(newState);
    this.flushSync();
    return this;
  };

  /**
   * Immediately merge the state with the given value
   * @param newState  The value to merge or function that will return value to merge
   */
  mergeSync = (newState: MergeableStateType) => {
    this.mergeState(newState);
    this.flushSync();
    return this;
  };

  /**
   * Schedule a value to be updated in the next batch of updates at the given path inside the state
   * @param path  The path to the value
   * @param newStateOrUpdater  The new value or a function that receives "oldState" as a first parameter
   */
  setStateAt = (path: string, newStateOrUpdater: any) => {
    const updater = updatePath(path);
    this.setState((old: any) => updater(old, newStateOrUpdater));
    return this;
  };

  /**
   * Immediately update a value at the given path inside the state
   * @param path  The path to the value
   * @param newStateOrUpdater  The new value or a function that receives "oldState" as a first parameter
   */
  setSyncAt = (path: string, newStateOrUpdater: any) => {
    const updater = updatePath(path);
    this.setSync((old: any) => updater(old, newStateOrUpdater));
    return this;
  };

  /**
   * Immediately apply all updates in the update queue and notify components
   * that they need to re-render. Note that React will not re-render
   * synchronously.
   * @return The resulting state
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
    // _notifyComponents sets #_state and we return it here for convenience
    return this.#_state;
  };

  /**
   * Create a clone of this store, including plugins but excluding event listeners
   * @param withConfigOverrides  Any Store configuration you want to override
   * @return The cloned store
   */
  clone = (withConfigOverrides: StoreConfigType = {}): Store => {
    const cloned = new Store({
      state: shallowCopy(this.#_state),
      actions: this.#_rawActions,
      autoReset: this.#_autoReset,
      options: this.#_options,
      id: this.id,
      ...withConfigOverrides,
    });
    for (const initializer of this.#_plugins) {
      cloned.plugin(initializer);
    }
    return cloned;
  };

  /**
   * Reset a store to its initial state
   * @param withStateOverrides  Additional state to override
   */
  reset = (withStateOverrides: any = undefined) => {
    const current = this.#_state;
    const event = this.emit('BeforeReset', {
      before: current,
      after: shallowOverride(this.#_initialState, withStateOverrides),
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
   * @return Resolves with the new state value
   */
  nextState = (): Promise<any> => {
    return new Promise(resolve => {
      this.once('AfterUpdate', () => resolve(this.#_state));
    });
  };

  /**
   * Return the number of components that "use" this store data
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
   * @param name  The name of the option
   */
  getOption = (name: string) => {
    return this.#_options[name];
  };

  /**
   * Set store options
   * @param newOptions  clear all other options then set these
   */
  setOptions = (newOptions: Record<string, any>) => {
    this.#_options = newOptions;
    return this;
  };

  /**
   * Add new store options (while leaving old ones intact)
   * @param addOptions  Add these options
   */
  extendOptions = (addOptions: Record<string, any>) => {
    Object.assign(this.#_options, addOptions);
    return this;
  };

  /**
   * Set a single store option
   * @param name  The name of the option
   * @param newValue  The value to set
   * @return {Store}
   */
  setOption = (name: string, newValue: any) => {
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
  plugin = (initializer: PluginFunctionType): PluginResultType => {
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
  use = (...middlewares: Function[]) => {
    this.#_middlewares.push(...middlewares);
    return this;
  };

  /**
   * Run all the registered middleware
   * @private
   * @param {Object} context  Object with prev, next, isAsync, store
   * @param {Function} callback  The function to call when all middlewares have called "next()"
   */
  #_runMiddlewares = (
    context: MiddlewareContextInterface,
    callback: Function
  ): void => {
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
  #_runMiddlewaresSync = (context: MiddlewareContextInterface): boolean => {
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
   * @param setState  A setState function from React.useState()
   * @note private but used by useStoreSelector()
   */
  _subscribe = (setState: SetterType) => {
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
   * @param setState  The setState function used to _subscribe
   * @note private but used by useStoreSelector()
   */
  _unsubscribe = (setState: SetterType) => {
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
   * @param prev  The previous state value
   * @param next  The next state value
   */
  #_getComponentUpdater = (prev: any, next: any): Function => {
    return function _maybeSetState(setter: SetterType) {
      if (
        typeof setter.mapState === 'function' &&
        typeof setter.equalityFn === 'function'
      ) {
        // registered from useStoreSelector so only re-render
        // components when the relevant slice of state changes
        const prevSelected = setter.mapState(prev);
        const nextSelected = setter.mapState(next);
        if (!setter.equalityFn(prevSelected, nextSelected)) {
          // the slice of state is not equal so rerender component
          setter.handler(nextSelected);
        }
      } else {
        // registered from useStoreState
        setter.handler(next);
      }
    };
  };

  /**
   * Process the update queue and return a Promise that resolves to the new state
   */
  #_getNextState = async (): Promise<any> => {
    let nextState = this.#_state;
    // process all updates or update functions
    // use while and shift in case setters trigger more setting
    const failsafeCascadeCount = 100;
    let failsafe = this.#_updateQueue.length + failsafeCascadeCount;
    while (this.#_updateQueue.length > 0) {
      /* istanbul ignore next @preserve */
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
  #_scheduleUpdates = (): void => {
    // Use Promise to queue state update for next tick
    // see https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/queueMicrotask
    Promise.resolve()
      .then(this.#_runUpdates)
      .catch(err => this.emit('SetterException', err));
  };

  /**
   * Run all queued updates and return a Promise that resolves to the new state
   */
  #_runUpdates = async (): Promise<void> => {
    const prevState = this.#_state;
    const event1 = this.emit('BeforeSet', prevState);
    if (event1.defaultPrevented) {
      // handler wants to block running state updaters
      this.#_updateQueue.length = 0;
      return;
    }
    const nextState = await this.#_getNextState();
    const context: MiddlewareContextInterface = {
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
  #_notifyComponents = (prev: any, next: any) => {
    // save final state result
    this.#_state = next;
    // update components with no selector or with matching selector
    this.#_setters.forEach((setter: SetterType) => {
      this.#_getComponentUpdater(prev, this.#_state)(setter);
    });
    // announce the final state
    this.emit('AfterUpdate', { prev, next: this.#_state });
  };

  /**
   * Process the update queue synchronously and return the new state
   * Note that any updater functions that return promises will be queued for later update.
   * @return The new state OR the previous state if updating was blocked
   */
  #_getNextStateSync = (): any => {
    let prev = this.#_state;
    let next = this.#_state;
    // process all updates or update functions
    // use while and shift in case setters trigger more setting
    const failsafeCascadeCount = 100;
    let failsafe = this.#_updateQueue.length + failsafeCascadeCount;
    while (this.#_updateQueue.length > 0) {
      /* istanbul ignore next @preserve */
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
            .catch((err: Error) => this.emit('SetterException', err));
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

  // observable plugin
  subscribe = pluginWarning('observable', 'subscribe');

  // undo plugin
  undo = pluginWarning('undo', 'undo');
  redo = pluginWarning('undo', 'redo');
  jump = pluginWarning('undo', 'jump');
  jumpTo = pluginWarning('undo', 'jumpTo');
  getHistory = pluginWarning('undo', 'getHistory');
}

function pluginWarning(pluginName: string, functionName: string): Function {
  return function throwForMissingPlugin() {
    throw new Error(
      `Import ${pluginName} and register it with "store.plugin(${pluginName}())" to use the "store.${functionName}()" function.`
    );
  };
}
