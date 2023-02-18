import SimpleEmitter from '../SimpleEmitter/SimpleEmitter';
import shallowOverride from '../../lib/shallowOverride/shallowOverride';
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
  MergeableStateType,
  MergeableStateAtPathType,
  FunctionStateType,
  FunctionStateAtType,
  KnownEventNames,
  SetStateOptionsType,
  EventHandlerType,
  EventType,
} from '../../types';
import { replacePath } from '../../lib/replacePath/replacePath';
import isPromise from '../../lib/isPromise/isPromise';
import isFunction from '../../lib/isFunction/isFunction';

// an internal counter for stores
let storeIdx = 1;

export default class Store<StateType = any> extends SimpleEmitter<
  StateType,
  KnownEventNames
> {
  readonly #autoReset: boolean;
  #hasInitialized = false;
  #idx: number;
  readonly #initialState: StateType;
  #middlewares: MiddlewareType<StateType>[] = [];
  #plugins: PluginFunctionType[] = [];
  #setters: SetterType<StateType, any>[] = [];
  #state: StateType;
  #usedCount = 0;
  #waitingQueue: SettableStateType<StateType>[] = [];
  #isWaiting = false;

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
      this.#hasInitialized = true;
    });
    this.#initialState = initialState;
    this.#state = initialState;
    this.id = String(id || `store-${storeIdx}`);
    this.#idx = storeIdx++;
    this.#autoReset = autoReset;
    this.locals = {};
  }

  /**
   * Connect a component to the store so that when relevant state changes, the component will be re-rendered
   * @param setState  A setState function from React.useState()
   * @note private but used by useStoreSelector()
   */
  attachComponent = (setState: SetterType<StateType, any>): void => {
    if (this.#usedCount++ === 0) {
      this.emit('BeforeFirstUse', this.#state);
    }
    if (this.#setters.length === 0) {
      this.emit('AfterFirstMount');
    }
    if (!this.#setters.includes(setState)) {
      this.#setters.push(setState);
      this.emit('AfterMount', this.#setters.length);
    }
    if (this.#usedCount === 1) {
      this.emit('AfterFirstUse', this.#state);
    }
  };

  /**
   * Disconnect a component from the store
   * @param setState  The setState function used to subscribe
   * @note private but used by useStoreSelector()
   */
  detachComponent = (setState: SetterType<StateType, any>): void => {
    const idx = this.#setters.indexOf(setState);
    if (idx > -1) {
      this.#setters.splice(idx, 1);
    }
    this.emit('AfterUnmount', this.#setters.length);
    if (this.#setters.length === 0) {
      if (this.#autoReset) {
        this.reset();
      }
      this.emit('AfterLastUnmount');
    }
  };

  /**
   * Return the initial state of the store
   */
  getInitialState = (): StateType => {
    return this.#initialState;
  };

  /**
   * Return the initial state of the store at the given path
   * @param path  Path string such as "cart" or "cart.total"
   */
  getInitialStateAt = <Path extends string>(
    path: Path
  ): StateAtType<Path, StateType> => {
    return selectPath(path)(this.#initialState);
  };

  /**
   * Return the current state of the store
   * @return  The current state
   */
  getState = (): StateType => {
    return this.#state;
  };

  /**
   * Return the current state of the store at the given path
   * @param path  Path string such as "cart" or "cart.total"
   */
  getStateAt = <Path extends string>(
    path: Path
  ): StateAtType<Path, StateType> => {
    return selectPath(path)(this.#state);
  };

  /**
   * Reset a store to its initial condition and initial state values,
   *   and notifies all consumer components
   * @return  This store
   * @chainable
   */
  reset = () => {
    this.resetState();
    this.#hasInitialized = false;
    this.#usedCount = 0;
    return this;
  };

  /**
   * Reset the store to its initial state values
   *   and notifies all consumer components
   */
  resetState = () => {
    this.setState(this.#initialState);
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
      this.once('AfterUpdate', (evt: EventType<StateType, 'AfterUpdate'>) =>
        resolve(evt.data.next)
      );
    });
  };

  /**
   * Return the number of components that "use" this store data
   */
  getUsedCount = () => {
    return this.#usedCount;
  };

  /**
   * Return true if any component has ever used this store
   */
  hasInitialized = () => {
    return this.#hasInitialized;
  };

  /**
   * Return the number of *mounted* components that "use" this store
   */
  getMountCount = () => {
    return this.#setters.length;
  };

  /**
   * Register a plugin
   * @param initializer  The function the plugin uses to configure and attach itself
   * @return  The return value of the plugin initializer function
   */
  plugin = (initializer: PluginFunctionType): any => {
    const result = initializer(this);
    this.#plugins.push(initializer);
    return result;
  };

  /**
   * Get the array of plugin initializer functions
   */
  getPlugins = () => {
    return this.#plugins;
  };

  /**
   * Register a middleware function
   * @param middlewares  The middleware function to register
   * @return  This store
   */
  use = (...middlewares: MiddlewareType<StateType>[]) => {
    this.#middlewares.push(...middlewares);
    return this;
  };

  /**
   * Run all the registered middleware
   * @private
   * @param context  Object with prev, next, isAsync, store
   * @param callback  The function to call when all middlewares have called "next()"
   */
  #runMiddlewares = (
    context: MiddlewareContextInterface<StateType>,
    callback: Function
  ): void => {
    let i = 0;
    const done = () => {
      if (i === this.#middlewares.length) {
        callback();
      } else {
        this.#middlewares[i++](context, done);
        // TODO: set context.isAsync = true if done doesn't get called immediately
      }
    };
    done();
  };

  #updateState = (newState: StateType, options?: SetStateOptionsType): void => {
    if (
      (this.#middlewares.length === 0 && !this.hasSubscriber('AfterUpdate')) ||
      options.bypassMiddleware ||
      options.bypassAll
    ) {
      // shortcut for speed
      const prev = this.#state;
      this.#state = newState;
      this.#notifyComponents(prev, newState, options);
      return;
    }
    const context = {
      prev: Object.freeze(this.#state),
      next: newState,
      store: this,
    };
    this.#runMiddlewares(context, () => {
      this.#state = context.next;
      if (this.#waitingQueue.length > 0) {
        const nextInQueue = this.#waitingQueue.shift();
        if (this.#waitingQueue.length === 0) {
          this.#isWaiting = false;
        }
        this.setState(nextInQueue, options);
      } else {
        this.#notifyComponents(context.prev, context.next, options);
      }
    });
  };

  /**
   * Schedule state to be updated in the next batch of updates
   * @param newStateOrUpdater  The new value or function that will return the new value
   * @param options  Options to allow bypassing render, middleware, event, all
   * @return  This store
   * @chainable
   */
  setState = (
    newStateOrUpdater: SettableStateType<StateType>,
    options: SetStateOptionsType = {}
  ) => {
    if (this.#isWaiting) {
      this.#waitingQueue.push(newStateOrUpdater);
      return this;
    }
    if (isFunction(newStateOrUpdater)) {
      newStateOrUpdater = (newStateOrUpdater as FunctionStateType<StateType>)(
        this.#state
      );
    }
    if (isPromise(newStateOrUpdater)) {
      this.#isWaiting = true;
      (newStateOrUpdater as Promise<StateType>).then(
        resolved => this.#updateState(resolved, options),
        rejection => this.emit('SetterRejection', rejection)
      );
    } else {
      this.#updateState(newStateOrUpdater as StateType, options);
    }
    return this;
  };

  /**
   * Schedule a value to be updated in the next batch of updates at the given path inside the state
   * @param path  The path to the value
   * @param newStateOrUpdater  The new value or a function that receives "oldState" as a first parameter
   * @param options  Options to allow bypassing render, middleware, event, all
   * @return  This store
   * @chainable
   */
  setStateAt = <Path extends string>(
    path: Path,
    newStateOrUpdater: SettableStateAtPathType<Path, StateType>,
    options: SetStateOptionsType = {}
  ) => {
    if (path === '@') {
      return this.setState(newStateOrUpdater, options);
    }
    let stateAt = this.getStateAt(path);
    if (
      path.includes('*') &&
      Array.isArray(stateAt) &&
      isFunction(newStateOrUpdater)
    ) {
      // type-fest's Get<> doesn't understand asterisks, so we have to suppress warning
      // @ts-ignore
      stateAt = this.#getMapUpdater(stateAt, newStateOrUpdater);
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
          const finalState = replacePath(this.#state, path, resolvedStateAt);
          this.#updateState(finalState, options);
        },
        rejection => this.emit('SetterRejection', rejection)
      );
    } else {
      const finalState = replacePath(this.#state, path, stateAt);
      this.#updateState(finalState, options);
    }
    return this;
  };

  #getMapUpdater = <T>(
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
   * Merge state into an Object or Array
   * @param newStateOrUpdater  The new value or function that will return the new value
   * @param options  Options to allow bypassing render, middleware, event, all
   * @return  This store
   * @chainable
   */
  mergeState = (
    newStateOrUpdater: MergeableStateType<StateType>,
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
   * Merge state at the given path into an Object or Array
   * @param newStateOrUpdater  The new value or function that will return the new value
   * @param options  Options to allow bypassing render, middleware, event, all
   * @return  This store
   * @chainable
   */
  mergeStateAt = <Path extends string>(
    path: Path,
    newStateOrUpdater: MergeableStateAtPathType<Path, StateType>,
    options: SetStateOptionsType = {}
  ) => {
    if (path === '@') {
      return this.mergeState(newStateOrUpdater, options);
    }
    let stateAt = this.getStateAt(path);
    let newStateAt;
    if (
      path.includes('*') &&
      Array.isArray(stateAt) &&
      isFunction(newStateOrUpdater)
    ) {
      // type-fest's Get<> doesn't understand asterisks, so we have to suppress warning
      // @ts-ignore
      newStateAt = this.#getMapUpdater(stateAt, newStateOrUpdater);
    } else if (isFunction(newStateOrUpdater)) {
      newStateAt = (newStateOrUpdater as FunctionStateAtType<Path, StateType>)(
        stateAt
      );
    } else {
      newStateAt = newStateOrUpdater as StateAtType<Path, StateType>;
    }
    if (isPromise(newStateAt)) {
      (newStateAt as Promise<StateAtType<Path, StateType>>).then(
        resolvedStateAt => {
          const mergedState = shallowOverride(stateAt, resolvedStateAt);
          const finalState = replacePath(this.#state, path, mergedState);
          this.#updateState(finalState, options);
        },
        rejection => this.emit('SetterRejection', rejection)
      );
    } else {
      const mergedState = shallowOverride(stateAt, newStateAt);
      const finalState = replacePath(this.#state, path, mergedState);
      this.#updateState(finalState, options);
    }
    return this;

    // this.setStateAt(
    //   path,
    //   old => {
    //     if (isFunction(newStateOrUpdater)) {
    //       newStateOrUpdater = (newStateOrUpdater as Function)(old);
    //     }
    //     if (isPromise(newStateOrUpdater)) {
    //       return (
    //         newStateOrUpdater as Promise<
    //           MergeableStateAtPathType<Path, StateType>
    //         >
    //       ).then(resolved => shallowOverride(old, resolved));
    //     } else {
    //       return shallowOverride(old, newStateOrUpdater);
    //     }
    //   },
    //   options
    // );
    // return this;
  };

  /**
   * Tell connected components to re-render if applicable
   * @param prev  The previous state value
   * @param next  The new state value
   */
  #notifyComponents = (
    prev: StateType,
    next: StateType,
    options: SetStateOptionsType
  ): void => {
    // save final state result
    this.#state = next;
    if (!options.bypassRender && !options.bypassAll) {
      // update components with no selector or with matching selector
      this.#setters.forEach((setter: SetterType<StateType, any>) => {
        this.#getComponentUpdater(prev, this.#state)(setter);
      });
    }
    if (!options.bypassEvent && !options.bypassAll) {
      // announce the final state
      Promise.resolve().then(() =>
        this.emit('AfterUpdate', { prev, next: this.#state })
      );
    }
  };

  /**
   * Get a function that will tell connected components to re-render
   * @param prev  The previous state value
   * @param next  The next state value
   */
  #getComponentUpdater = (prev: StateType, next: StateType) => {
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

// TODO: remove leading BOM if present
// visualWidth => string-width
function slice(str: string, from: number = 0, to: number = undefined): string {
  return [...str].slice(from, to).join('');
}
function length(str: string): number {
  return [...str].length;
}
function split(str: string, on: string = ''): string[] {
  if (on === '') {
    return [...str];
  }
  return str.split(on);
}
function truncateBytes() {}
function codePointAt(str: string, at: number = 0): number {
  if (at < 0) {
    return undefined;
  }
  for (const char of str) {
    if (at-- === 0) {
      return char.codePointAt(0);
    }
  }
  return undefined;
}
function charAt(str: string, at: number = 0): string {
  if (at < 0) {
    return '';
  }
  for (const char of str) {
    if (at-- === 0) {
      return char;
    }
  }
  return '';
}
