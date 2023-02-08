import SimpleEmitter from '../SimpleEmitter/SimpleEmitter';
import shallowOverride from '../../lib/shallowOverride/shallowOverride';
import shallowAssign from '../../lib/shallowAssign/shallowAssign';
import selectPath from '../../lib/selectPath/selectPath';
import {
  StoreConfigType,
  SetterType,
  SettableStateType,
  MiddlewareContextInterface,
  MiddlewareType,
  PlainObjectType,
  PluginFunctionType,
  ExtendStateAtPathType,
  SettableStateAtPathType,
  StateAtType,
  MergeableStateAtPathType,
  EventDataType,
  FunctionStateType,
  FunctionStateAtType,
  MergeableType,
  SetStateOptionsType,
} from '../../types';
import { replacePath } from '../../lib/replacePath/replacePath';
import isPromise from '../../lib/isPromise/isPromise';
import isFunction from '../../lib/isFunction/isFunction';

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

  /**
   * A string to identify the store by
   */
  id: string;
  /**
   * Values to attach that may be used by other stores
   */
  locals: PlainObjectType;

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
    this.on('BeforeInitialize', () => {
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
  ): StateAtType<Path, StateType> => {
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
  ): StateAtType<Path, StateType> => {
    return selectPath(path)(this.#_state);
  };

  /**
   * Reset a store to its initial condition and initial state values,
   *   and notifies all consumer components
   * @return  This store
   * @chainable
   */
  reset = () => {
    this.resetState();
    this.#_hasInitialized = false;
    this.#_usedCount = 0;
    return this;
  };

  /**
   * Reset the store to its initial state values
   *   and notifies all consumer components
   */
  resetState = () => {
    this.setState(this.#_initialState);
    return this;
  };

  /**
   * Reset the store at the given path to its initial state values
   *   and notifies all consumer components
   */
  resetStateAt = (path: string) => {
    this.setStateAt(path, this.getInitialStateAt(path));
    return this;
  };

  /**
   * Bind an action creator function to this store
   * @param creator  The function to bind
   */
  connect = (creator: Function) => {
    return creator.bind(this);
  };

  /**
   * Return a promise that will resolve once the store gets a new state
   * @return Resolves with the new state value
   */
  nextState = (): Promise<StateType> => {
    return new Promise(resolve => {
      this.once('AfterUpdate', evt => resolve(evt.data.next));
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
   */
  hasInitialized = () => {
    return this.#_hasInitialized;
  };

  /**
   * Return the number of *mounted* components that "use" this store
   */
  getMountCount = () => {
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
  getPlugins = () => {
    return this.#_plugins;
  };

  /**
   * Register a middleware function
   * @param middlewares  The middleware function to register
   * @return  This store
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
        // TODO: set context.isAsync = true if done doesn't get called immediately
      }
    };
    done();
  };

  #_updateState = (
    newState: StateType,
    options?: SetStateOptionsType
  ): void => {
    if (
      (this.#_middlewares.length === 0 && !this.hasSubscriber('AfterUpdate')) ||
      options.bypassMiddleware
    ) {
      // shortcut for speed
      const prev = this.#_state;
      this.#_state = newState;
      this.#_notifyComponents(prev, newState, options);
      return;
    }
    const context = {
      prev: Object.freeze(this.#_state),
      next: newState,
      store: this,
    };
    this.#_runMiddlewares(context, () => {
      this.#_state = context.next;
      if (this.#_waitingQueue.length > 0) {
        const nextInQueue = this.#_waitingQueue.shift();
        if (this.#_waitingQueue.length === 0) {
          this.#_isWaiting = false;
        }
        this.setState(nextInQueue, options);
      } else {
        this.#_notifyComponents(context.prev, context.next, options);
      }
    });
  };

  #_waitingQueue = [];
  #_isWaiting = false;

  /**
   * Schedule state to be updated in the next batch of updates
   * @param newStateOrUpdater  The new value or function that will return the new value
   * @return  This store
   * @chainable
   */
  setState = (
    newStateOrUpdater: SettableStateType<StateType>,
    options: SetStateOptionsType = {}
  ) => {
    if (this.#_isWaiting) {
      this.#_waitingQueue.push(newStateOrUpdater);
      return this;
    }
    if (isFunction(newStateOrUpdater)) {
      newStateOrUpdater = (newStateOrUpdater as FunctionStateType<StateType>)(
        this.#_state
      );
    }
    if (isPromise(newStateOrUpdater)) {
      this.#_isWaiting = true;
      (newStateOrUpdater as Promise<StateType>).then(
        resolved => this.#_updateState(resolved, options),
        error => this.emit('SetterException', error)
      );
    } else {
      this.#_updateState(newStateOrUpdater as StateType, options);
    }
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
    newStateOrUpdater: SettableStateAtPathType<Path, StateType>,
    options: SetStateOptionsType = {}
  ) => {
    let stateAt = this.getStateAt(path);
    if (
      path.includes('*') &&
      Array.isArray(stateAt) &&
      isFunction(newStateOrUpdater)
    ) {
      // type-fest's Get<> doesn't understand asterisks, so we have to suppress warning
      // @ts-ignore
      stateAt = this.#_getMapUpdater(stateAt, newStateOrUpdater);
    } else if (isFunction(newStateOrUpdater)) {
      stateAt = (newStateOrUpdater as FunctionStateAtType<Path, StateType>)(
        stateAt
      );
    } else {
      stateAt = newStateOrUpdater as StateAtType<Path, StateType>;
    }
    if (isPromise(stateAt)) {
      (stateAt as Promise<StateAtType<Path, StateType>>).then(
        resolvedStateAt => {
          const finalState = replacePath(this.#_state, path, resolvedStateAt);
          this.#_updateState(finalState, options);
        },
        error => this.emit('SetterException', error)
      );
    } else {
      const finalState = replacePath(this.#_state, path, stateAt);
      this.#_updateState(finalState, options);
    }
    return this;
  };

  #_getMapUpdater = <T>(
    arrayOfState: T[],
    updater: (old: T) => T
  ): Function | Promise<Function> => {
    const mapped = arrayOfState.map(updater);
    let i = 0;
    if (mapped.some(isPromise)) {
      return Promise.all(mapped).then(resolved => () => resolved[i++]);
    } else {
      return () => mapped[i++];
    }
  };

  /**
   * Schedule state to be merged in the next batch of updates
   * @param newStateOrUpdater  The new value or function that will return the new value
   * @return  This store
   * @chainable
   */
  mergeState = (
    newStateOrUpdater: SettableStateType<StateType>,
    options: SetStateOptionsType = {}
  ) => {
    this.setState(old => {
      if (isFunction(newStateOrUpdater)) {
        newStateOrUpdater = (newStateOrUpdater as Function)(old);
      }
      if (isPromise(newStateOrUpdater)) {
        return (newStateOrUpdater as Promise<StateType>).then(resolved =>
          shallowOverride(old, resolved)
        );
      } else {
        return shallowOverride(old, newStateOrUpdater);
      }
    }, options);
    return this;
  };

  /**
   * Schedule state to be merged in the next batch of updates
   * @param newStateOrUpdater  The new value or function that will return the new value
   * @return  This store
   * @chainable
   */
  mergeStateAt = <Path extends string>(
    path: Path,
    newStateOrUpdater: MergeableStateAtPathType<Path, MergeableType<StateType>>
  ) => {
    this.setStateAt(path, old => {
      if (isFunction(newStateOrUpdater)) {
        newStateOrUpdater = (newStateOrUpdater as Function)(old);
      }
      if (isPromise(newStateOrUpdater)) {
        return (newStateOrUpdater as Promise<MergeableType<StateType>>).then(
          resolved => shallowOverride(old, resolved)
        );
      } else {
        return shallowOverride(old, newStateOrUpdater);
      }
    });
    return this;
  };

  replaceState = (newState: StateType) => {
    this.setState(newState, {
      bypassRender: true,
      bypassMiddleware: true,
      bypassEvent: true,
    });
    return this;
  };

  replaceStateAt = <Path extends string>(
    path: Path,
    newState: SettableStateAtPathType<Path, StateType>
  ) => {
    this.setStateAt(path, newState, {
      bypassRender: true,
      bypassMiddleware: true,
      bypassEvent: true,
    });
    return this;
  };

  /**
   * Tell connected components to re-render if applicable
   * @param prev  The previous state value
   * @param next  The new state value
   */
  #_notifyComponents = (
    prev: StateType,
    next: StateType,
    options: SetStateOptionsType
  ): void => {
    // save final state result
    this.#_state = next;
    if (!options.bypassRender) {
      // update components with no selector or with matching selector
      this.#_setters.forEach((setter: SetterType<StateType, any>) => {
        this.#_getComponentUpdater(prev, this.#_state)(setter);
      });
    }
    if (!options.bypassEvent) {
      // announce the final state
      Promise.resolve().then(() =>
        this.emit('AfterUpdate', { prev, next: this.#_state })
      );
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
          setter.handler(nextSelected);
        }
      } else {
        // registered from useStoreState
        setter.handler(next);
      }
    };
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
