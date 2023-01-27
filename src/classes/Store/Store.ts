import SimpleEmitter from '../SimpleEmitter/SimpleEmitter';
import shallowCopy from '../../lib/shallowCopy/shallowCopy';
import shallowOverride from '../../lib/shallowOverride/shallowOverride';
import shallowAssign from '../../lib/shallowAssign/shallowAssign';
import { updatePath } from '../../lib/updatePath/updatePath';
import selectPath from '../../lib/selectPath/selectPath';
import {
  StoreConfigType,
  SetterType,
  SettableStateType,
  MergeableStateType,
  MiddlewareContextInterface,
  MiddlewareType,
  PlainObjectType,
  PluginFunctionType,
} from '../../types';
import { Get } from 'type-fest';

// an internal counter for stores
let storeIdx = 1;

export default class Store<StateType = any> extends SimpleEmitter<StateType> {
  readonly #_autoReset: boolean;
  #_hasInitialized = false;
  #_idx: number;
  readonly #_initialState: StateType;
  #_middlewares: MiddlewareType<StateType>[] = [];
  #_plugins: PluginFunctionType[] = [];
  #_setters: SetterType<StateType, any>[] = [];
  #_state: StateType;
  #_updateQueue: SettableStateType<StateType>[] = [];
  #_usedCount = 0;
  locals: PlainObjectType;

  /**
   * A string to identify the store by
   */
  id: string;

  /**
   * Create a new store with the given state and actions
   * @param initialState  The store's initial state; it can be of any type
   * @param options
   * @property options.autoReset  True to reset state after all components unmount
   * @property options.id  An identifier that could be used by plugins or event listeners
   */
  constructor(
    initialState: StateType = undefined,
    { autoReset = false, id = '' }: StoreConfigType = {}
  ) {
    super();
    this.on('BeforeFirstUse', () => {
      this.#_hasInitialized = true;
    });
    this.#_initialState = initialState;
    this.#_state = initialState;
    this.id = String(id || `store-${storeIdx}`);
    this.#_idx = storeIdx++;
    this.#_autoReset = autoReset;
    this.locals = {};
  }

  /**
   * Return the initial state of the store
   */
  getInitialState = (): StateType => {
    return this.#_initialState;
  };

  /**
   * Return the initial state of the store at the given path
   * @param path  Path string such as "cart" or "cart.total"
   */
  getInitialStateAt = <Path extends string>(
    path: Path
  ): Get<StateType, Path, { strict: false }> => {
    return selectPath(path)(this.#_initialState);
  };

  /**
   * Return the current state of the store
   * @return  The current state
   */
  getState = (): StateType => {
    return this.#_state;
  };

  /**
   * Return the current state of the store at the given path
   * @param path  Path string such as "cart" or "cart.total"
   */
  getStateAt = <Path extends string>(
    path: Path
  ): Get<StateType, Path, { strict: false }> => {
    return selectPath(path)(this.#_state);
  };

  /**
   * Bind an action creator function to this store
   * @param creator  The function to bind
   */
  connect = (creator: Function) => {
    return creator.bind(this);
  };

  /**
   * Schedule state to be updated in the next batch of updates
   * @param newState  The new value or function that will return the new value
   * @return  This store
   * @chainable
   */
  setState = (newState: SettableStateType<StateType>) => {
    this.#_updateQueue.push(newState);
    if (this.#_updateQueue.length === 1) {
      this.#_scheduleUpdates();
    }
    return this;
  };

  /**
   * Schedule state to be merged in the next batch of updates
   * @param newState  The value to merge or function that will return value to merge
   * @return  This store
   * @chainable
   */
  mergeState = (newState: MergeableStateType<StateType>) => {
    let updater;
    if (typeof newState === 'function') {
      updater = (old: StateType) => {
        const partial = newState(old);
        if (partial instanceof Promise) {
          return partial.then((promisedState: Object) =>
            shallowOverride(old, promisedState)
          );
        }
        return shallowOverride(old, partial);
      };
    } else {
      updater = (old: MergeableStateType<StateType>) =>
        shallowOverride(old, newState);
    }
    this.#_updateQueue.push(updater);
    if (this.#_updateQueue.length === 1) {
      this.#_scheduleUpdates();
    }
    return this;
  };

  /**
   * Update state immediately without triggering re-renders.
   * Good for sub-stores and plugins that subscribe to BeforeFirstUse.
   * @param moreState  The values to merge into the state (components will not be notified)
   */
  extendState = (moreState: Partial<StateType>) => {
    if (typeof moreState !== 'object' || typeof this.#_state !== 'object') {
      throw new Error(
        'react-thermals Store.extendState(moreState): current state and given state must both be objects'
      );
    }
    shallowAssign(this.#_state, moreState);
    return this;
  };

  /**
   * Update state at the given path immediately without triggering re-renders.
   * Good for sub-stores and plugins that subscribe to BeforeFirstUse.
   * @param path  The path to the value
   * @param moreState  The values to merge into the state (components will not be notified)
   * @return  This store
   * @chainable
   */
  extendStateAt = <Path extends string>(
    path: Path,
    moreState: Partial<Get<StateType, Path, { strict: false }>>
  ) => {
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
    shallowAssign(target, moreState);
    return this;
  };

  /**
   * Immediately update the state to the given value
   * @param newStateOrUpdater The new value or function that will return the new value
   * @return  This store
   * @chainable
   */
  setSync = (newStateOrUpdater: SettableStateType<StateType>) => {
    this.setState(newStateOrUpdater);
    this.flushSync();
    return this;
  };

  /**
   * Immediately merge the state with the given value
   * @param newStateOrUpdater  The value to merge or function that will return value to merge
   * @return  This store
   * @chainable
   */
  mergeSync = (newStateOrUpdater: MergeableStateType<StateType>) => {
    this.mergeState(newStateOrUpdater);
    this.flushSync();
    return this;
  };

  /**
   * Schedule a value to be updated in the next batch of updates at the given path inside the state
   * @param path  The path to the value
   * @param newStateOrUpdater  The new value or a function that receives "oldState" as a first parameter
   * @return  This store
   * @chainable
   */
  setStateAt = <Path extends string>(
    path: Path,
    newStateOrUpdater:
      | Get<StateType, Path, { strict: false }>
      | ((
          old: Get<StateType, Path, { strict: false }>
        ) => Get<StateType, Path, { strict: false }>)
  ) => {
    const updater = updatePath(path);
    this.setState((old: StateType) => updater(old, newStateOrUpdater));
    return this;
  };

  /**
   * Immediately update a value at the given path inside the state
   * @param path  The path to the value
   * @param newStateOrUpdater  The new value or a function that receives "oldState" as a first parameter
   * @return  This store
   * @chainable
   */
  setSyncAt = <Path extends string>(
    path: Path,
    newStateOrUpdater:
      | Get<StateType, Path, { strict: false }>
      | ((
          old: Get<StateType, Path, { strict: false }>
        ) => Get<StateType, Path, { strict: false }>)
  ) => {
    const updater = updatePath(path);
    this.setSync(old => updater(old, newStateOrUpdater));
    return this;
  };

  /**
   * Immediately apply all updates in the update queue and notify components
   * that they need to re-render. Note that React will not re-render
   * synchronously.
   * @return The resulting state
   */
  flushSync = (): StateType => {
    const prevState = this.#_state;
    let nextState;
    try {
      nextState = this.#_getNextStateSync();
    } catch (err) {
      this.emit('SetterException', err);
      return prevState;
    }
    // save final state result (a handler may have altered the final result)
    // then notify affected components
    this.#_notifyComponents(prevState, nextState);
    // _notifyComponents sets #_state equal to nextState,
    // and we return the new state here for convenience
    return this.#_state;
  };

  /**
   * Create a clone of this store, including plugins but excluding event listeners
   * @param withConfigOverrides  Any Store configuration you want to override
   * @return The cloned store
   */
  clone = (withConfigOverrides: StoreConfigType = {}) => {
    const cloned = new Store({
      state: shallowCopy(this.#_state),
      autoReset: this.#_autoReset,
      id: this.id,
      ...withConfigOverrides,
    });
    for (const initializer of this.#_plugins) {
      cloned.plugin(initializer);
    }
    return cloned;
  };

  /**
   * Reset a store to its initial condition and initial state values,
   *   and notifies all consumer components
   * @return  This store
   * @chainable
   */
  reset = () => {
    this.setState(this.#_initialState);
    // TODO: should we block middleware from running?
    this.#_hasInitialized = false;
    this.#_usedCount = 0;
    return this;
  };

  resetState = () => {
    this.setState(this.#_initialState);
    return this;
  };
  resetStateAt = (path: string) => {
    this.setStateAt(path, this.getInitialStateAt(path));
    return this;
  };
  resetSync = () => {
    this.setSync(this.#_initialState);
    return this;
  };
  resetSyncAt = (path: string) => {
    this.setStateAt(path, this.getInitialStateAt(path));
    return this;
  };

  /**
   * Return a promise that will resolve once the store gets a new state
   * @return Resolves with the new state value
   */
  nextState = (): Promise<StateType> => {
    return new Promise(resolve => {
      this.once('AfterUpdate', () => resolve(this.#_state));
    });
  };

  /**
   * Return the number of components that "use" this store data
   */
  getUsedCount = (): number => {
    return this.#_usedCount;
  };

  /**
   * Return true if any component has ever used this store
   */
  hasInitialized = (): boolean => {
    return this.#_hasInitialized;
  };

  /**
   * Return the number of *mounted* components that "use" this store
   */
  getMountCount = (): number => {
    return this.#_setters.length;
  };

  /**
   * Register a plugin
   * @param initializer  The function the plugin uses to configure and attach itself
   * @return  The return value of the plugin initializer function
   */
  plugin = (initializer: PluginFunctionType): any => {
    const result = initializer(this);
    this.#_plugins.push(initializer);
    return result;
  };

  /**
   * Get the array of plugin initializer functions
   */
  getPlugins = (): PluginFunctionType[] => {
    return this.#_plugins;
  };

  /**
   * Register a middleware function
   * @param middlewares  The middleware function to register
   * @return  This store
   * @chainable
   */
  use = (...middlewares: MiddlewareType<StateType>[]) => {
    this.#_middlewares.push(...middlewares);
    return this;
  };

  /**
   * Run all the registered middleware
   * @private
   * @param context  Object with prev, next, isAsync, store
   * @param callback  The function to call when all middlewares have called "next()"
   */
  #_runMiddlewares = (
    context: MiddlewareContextInterface<StateType>,
    callback: Function
  ): void => {
    let i = 0;
    const done = () => {
      if (i === this.#_middlewares.length) {
        callback();
      } else {
        this.#_middlewares[i++](context, done);
      }
    };
    done();
  };

  /**
   * Run all the registered middleware synchronously. Any middleware that does not
   * immediately call "next()" will cancel the update
   * @private
   * @param context  Object with prev, next, isAsync, store
   * @return  True unless middleware did not return right away
   */
  #_runMiddlewaresSync = (
    context: MiddlewareContextInterface<StateType>
  ): boolean => {
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
  _subscribe = (setState: SetterType<StateType, any>): void => {
    if (this.#_usedCount++ === 0) {
      this.emit('BeforeFirstUse', this.#_state);
    }
    if (this.#_setters.length === 0) {
      this.emit('AfterFirstMount');
    }
    if (!this.#_setters.includes(setState)) {
      this.#_setters.push(setState);
      this.emit('AfterMount', this.#_setters.length);
    }
    if (this.#_usedCount === 1) {
      this.emit('AfterFirstUse', this.#_state);
    }
  };

  /**
   * Disconnect a component from the store
   * @param setState  The setState function used to _subscribe
   * @note private but used by useStoreSelector()
   */
  _unsubscribe = (setState: SetterType<StateType, any>): void => {
    const idx = this.#_setters.indexOf(setState);
    if (idx > -1) {
      this.#_setters.splice(idx, 1);
    }
    this.emit('AfterUnmount', this.#_setters.length);
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
  #_getComponentUpdater = (prev: StateType, next: StateType) => {
    return function _maybeSetState(setter: SetterType<StateType, any>) {
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
          setter.handler(next);
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
  #_getNextState = async (): Promise<StateType> => {
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
      if (updatedState instanceof Function) {
        const maybeNext = updatedState(nextState);
        if (maybeNext instanceof Promise) {
          try {
            nextState = await maybeNext;
          } catch (rejection) {
            this.emit('SetterException', rejection);
          }
        } else {
          nextState = maybeNext;
        }
      } else if (updatedState instanceof Promise) {
        try {
          nextState = await updatedState;
        } catch (rejection) {
          this.emit('SetterException', rejection);
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
    const nextState = await this.#_getNextState();
    const context: MiddlewareContextInterface<StateType> = {
      prev: prevState,
      next: nextState,
      isAsync: true,
      store: this,
    };
    this.#_runMiddlewares(context, () => {
      // save final state result (a handler may have altered the final result)
      // then notify affected components
      this.#_notifyComponents(prevState, context.next);
    });
  };

  /**
   * Tell connected components to re-render if applicable
   * @param prev  The previous state value
   * @param next  The new state value
   */
  #_notifyComponents = (prev: StateType, next: StateType): void => {
    // save final state result
    this.#_state = next;
    // update components with no selector or with matching selector
    this.#_setters.forEach((setter: SetterType<StateType, any>) => {
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
  #_getNextStateSync = (): StateType => {
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
      if (updatedState instanceof Function) {
        const maybeNext = updatedState(next);
        if (maybeNext instanceof Promise) {
          // we want to call all state mutator functions synchronously,
          // but we have a mutator that returned a Promise, so we need
          // to circle back and set state after the Promise resolves
          maybeNext
            .then(this.setState)
            .catch((err: Error) => this.emit('SetterException', err));
        } else {
          next = maybeNext;
        }
      } else if (updatedState instanceof Promise) {
        // we want to call all state synchronously
        // but the returned state is a Promise, so we need
        // to circle back and set state after the Promise resolves
        updatedState
          .then(this.setState)
          .catch((err: Error) => this.emit('SetterException', err));
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
