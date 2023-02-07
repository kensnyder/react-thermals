import SimpleEmitter from '../SimpleEmitter/SimpleEmitter';
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
  ExtendStateAtPathType,
  SettableStateAtPathType,
  StateAtType,
  MergeableStateAtPathType,
  EventDataType,
  FunctionStateType,
  FunctionStateAtType,
} from '../../types';
import { replacePath } from '../../lib/replacePath/replacePath';
import { isPromise } from '../../lib/isPromise/isPromise';

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

  #_updateState = (newState: StateType): void => {
    if (this.#_middlewares.length === 0 && !this.hasSubscriber('AfterUpdate')) {
      // shortcut for speed
      this.#_state = newState;
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
        this.setState(nextInQueue);
      } else {
        // emit update event on next tick
        Promise.resolve().then(() => {
          this.emit('AfterUpdate', {
            prev: context.prev,
            next: context.next,
          });
        });
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
  setState = (newStateOrUpdater: SettableStateType<StateType>) => {
    if (this.#_isWaiting) {
      this.#_waitingQueue.push(newStateOrUpdater);
      return this;
    }
    if (typeof newStateOrUpdater === 'function') {
      newStateOrUpdater = (newStateOrUpdater as FunctionStateType<StateType>)(
        this.#_state
      );
    }
    if (isPromise(newStateOrUpdater)) {
      this.#_isWaiting = true;
      (newStateOrUpdater as Promise<StateType>).then(
        this.#_updateState,
        error => this.emit('SetterException', error)
      );
    } else {
      this.#_updateState(newStateOrUpdater as StateType);
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
    newStateOrUpdater: SettableStateAtPathType<Path, StateType>
  ) => {
    let stateAt = this.getStateAt(path);
    if (
      path.includes('*') &&
      Array.isArray(stateAt) &&
      typeof newStateOrUpdater === 'function'
    ) {
      // type-fest's Get<> doesn't understand asterisks, so we have to suppress warning
      // @ts-ignore
      stateAt = this.#_getMapUpdater(stateAt, newStateOrUpdater);
    } else if (typeof newStateOrUpdater === 'function') {
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
          this.#_updateState(finalState);
        },
        error => this.emit('SetterException', error)
      );
    } else {
      const finalState = replacePath(this.#_state, path, stateAt);
      this.#_updateState(finalState);
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
  mergeState = (newStateOrUpdater: SettableStateType<Partial<StateType>>) => {
    this.setState(old => {
      if (typeof newStateOrUpdater === 'function') {
        newStateOrUpdater = (newStateOrUpdater as Function)(old);
      }
      if (isPromise(newStateOrUpdater)) {
        return (newStateOrUpdater as Promise<Partial<StateType>>).then(
          resolved => shallowOverride(old, resolved)
        );
      } else {
        return shallowOverride(old, newStateOrUpdater);
      }
    });
    return this;
  };
  //
  // /**
  //  * Schedule state to be updated in the next batch of updates
  //  * @param newState  The new value or function that will return the new value
  //  * @return  This store
  //  * @chainable
  //  */
  // setState = (newState: SettableStateType<StateType>) => {
  //   this.#_updateQueue.push(newState);
  //   if (this.#_updateQueue.length === 1) {
  //     this.#_scheduleUpdates();
  //   }
  //   return this;
  // };
  //
  // /**
  //  * Immediately update the state to the given value
  //  * @param newStateOrUpdater The new value or function that will return the new value
  //  * @return  This store
  //  * @chainable
  //  */
  // setSync = (newStateOrUpdater: SettableStateType<StateType>) => {
  //   this.#_updateQueue.push(newStateOrUpdater);
  //   this.#_runUpdatesSync();
  //   return this;
  // };
  //
  // /**
  //  * Schedule state to be merged in the next batch of updates
  //  * @param newStateOrUpdater  The value to merge or function that will return value to merge
  //  * @return  This store
  //  * @chainable
  //  */
  // mergeState = (newStateOrUpdater: MergeableStateType<StateType>) => {
  //   let updater;
  //   if (typeof newStateOrUpdater === 'function') {
  //     updater = (old: StateType) => {
  //       const partial = newStateOrUpdater(old);
  //       if (partial instanceof Promise) {
  //         return partial.then((promisedState: Object) =>
  //           shallowOverride(old, promisedState)
  //         );
  //       }
  //       return shallowOverride(old, partial);
  //     };
  //   } else {
  //     updater = (old: MergeableStateType<StateType>) =>
  //       shallowOverride(old, newStateOrUpdater);
  //   }
  //   this.#_updateQueue.push(updater);
  //   if (this.#_updateQueue.length === 1) {
  //     this.#_scheduleUpdates();
  //   }
  //   return this;
  // };
  //
  // /**
  //  * Schedule state to be merged in the next batch of updates
  //  * @param path  The path expression
  //  * @param newStateOrUpdater  The value to merge or function that will return value to merge
  //  * @return  This store
  //  * @chainable
  //  */
  // mergeStateAt = <Path extends string>(
  //   path: Path,
  //   newStateOrUpdater: MergeableStateAtPathType<Path, StateType>
  // ) => {
  //   if (typeof newStateOrUpdater === 'function') {
  //     const oldState = this.getStateAt(path);
  //     newStateOrUpdater = newStateOrUpdater(oldState);
  //   }
  //   if (newStateOrUpdater instanceof Promise) {
  //     newStateOrUpdater.then(
  //       newState =>
  //         this.setStateAt(path, old => shallowOverride(old, newState)),
  //       error => this.emit('SetterException', error)
  //     );
  //   } else {
  //     this.setStateAt(path, old => shallowOverride(old, newStateOrUpdater));
  //   }
  //   return this;
  // };
  //
  // /**
  //  * Provide state to be merged immediately
  //  * @param path  The path expression
  //  * @param newStateOrUpdater  The value to merge or function that will return value to merge
  //  * @return  This store
  //  * @chainable
  //  */
  // mergeSyncAt = <Path extends string>(
  //   path: Path,
  //   newStateOrUpdater: MergeableStateAtPathType<Path, StateType>
  // ) => {
  //   const oldState = this.getStateAt(path);
  //   if (typeof newStateOrUpdater === 'function') {
  //     newStateOrUpdater = newStateOrUpdater(oldState);
  //   }
  //   if (newStateOrUpdater instanceof Promise) {
  //     newStateOrUpdater.then(
  //       newState => this.setSyncAt(path, shallowOverride(oldState, newState)),
  //       error => this.emit('SetterException', error)
  //     );
  //   } else {
  //     this.setSyncAt(path, shallowOverride(oldState, newStateOrUpdater));
  //   }
  //   return this;
  // };
  //
  // /**
  //  * Set state immediately without triggering re-renders.
  //  * Good for plugins that subscribe to BeforeFirstUse.
  //  * @param newState  The new state value (components will not be notified)
  //  * @return  This store
  //  * @chainable
  //  */
  // replaceSync = (newState: StateType) => {
  //   this.#_state = newState;
  //   return this;
  // };
  //
  // /**
  //  * Set state at the given path immediately without triggering re-renders.
  //  * Good for plugins that subscribe to BeforeInitialize.
  //  * @param path  The path to the value
  //  * @param newState  The new state value (components will not be notified)
  //  * @return  This store
  //  * @chainable
  //  */
  // replaceSyncAt = <Path extends string>(
  //   path: Path,
  //   newState: StateAtType<Path, StateType>
  // ) => {
  //   if (path === '@') {
  //     return this.replaceSync(newState);
  //   }
  //   this.#_state = updatePath(path)(this.#_state, newState);
  //   return this;
  // };
  //
  // /**
  //  * Add to state immediately without triggering re-renders.
  //  * Good for sub-stores and plugins that subscribe to BeforeInitialize.
  //  * @param moreState  The values to merge into the state (components will not be notified)
  //  */
  // extendSync = (moreState: Partial<StateType>) => {
  //   if (typeof moreState !== 'object' || typeof this.#_state !== 'object') {
  //     throw new Error(
  //       'react-thermals Store.extendSync(moreState): current state and given state must both be objects'
  //     );
  //   }
  //   // yes this mutates the normally immutable state
  //   shallowAssign(this.#_state, moreState);
  //   return this;
  // };
  //
  // /**
  //  * Add to state at the given path immediately without triggering re-renders.
  //  * Good for sub-stores and plugins that subscribe to BeforeInitialize.
  //  * @param path  The path to the value
  //  * @param moreState  The values to merge into the state (components will not be notified)
  //  * @return  This store
  //  * @chainable
  //  */
  // extendSyncAt = <Path extends string>(
  //   path: Path,
  //   moreState: ExtendStateAtPathType<Path, StateType>
  // ) => {
  //   if (typeof moreState !== 'object') {
  //     throw new Error(
  //       'react-thermals Store.extendSyncAt(path, moreState): given state must an object'
  //     );
  //   }
  //   const target = selectPath(path)(this.#_state);
  //   if (typeof target !== 'object') {
  //     throw new Error(
  //       'react-thermals Store.extendSyncAt(path, moreState): state at path must be an object'
  //     );
  //   }
  //   // yes this mutates the normally immutable state
  //   shallowAssign(target, moreState);
  //   return this;
  // };
  //
  // /**
  //  * Immediately merge the state with the given value
  //  * @param newStateOrUpdater  The value to merge or function that will return value to merge
  //  * @return  This store
  //  * @chainable
  //  */
  // mergeSync = (newStateOrUpdater: MergeableStateType<StateType>) => {
  //   this.mergeState(newStateOrUpdater);
  //   this.flushSync();
  //   return this;
  // };
  //
  // /**
  //  * Schedule a value to be updated in the next batch of updates at the given path inside the state
  //  * @param path  The path to the value
  //  * @param newStateOrUpdater  The new value or a function that receives "oldState" as a first parameter
  //  * @return  This store
  //  * @chainable
  //  */
  // setStateAt = <Path extends string>(
  //   path: Path,
  //   newStateOrUpdater: SettableStateAtPathType<Path, StateType>
  // ) => {
  //   let stateAt;
  //   if (newStateOrUpdater instanceof Function) {
  //     stateAt = newStateOrUpdater(this.getStateAt(path));
  //   } else {
  //     stateAt = newStateOrUpdater;
  //   }
  //   if (stateAt instanceof Promise) {
  //     stateAt.then(
  //       finalStateAt => {
  //         const finalState = updatePath(path)(this.#_state, finalStateAt);
  //         this.#_scheduleUpdatesWith(finalState);
  //       },
  //       error => this.emit('SetterException', error)
  //     );
  //   } else {
  //     const finalState = updatePath(path)(this.#_state, stateAt);
  //     this.#_scheduleUpdatesWith(finalState);
  //   }
  //   return this;
  // };
  //
  // /**
  //  * Immediately update a value at the given path inside the state
  //  * @param path  The path to the value
  //  * @param newStateOrUpdater  The new value or a function that receives "oldState" as a first parameter
  //  * @return  This store
  //  * @chainable
  //  */
  // setSyncAt = <Path extends string>(
  //   path: Path,
  //   newStateOrUpdater: SettableStateAtPathType<Path, StateType>
  // ) => {
  //   let stateAt;
  //   if (newStateOrUpdater instanceof Function) {
  //     stateAt = newStateOrUpdater(this.getStateAt(path));
  //   } else {
  //     stateAt = newStateOrUpdater;
  //   }
  //   const finalState = updatePath(path)(this.#_state, stateAt);
  //   this.#_runUpdatesWithSync(finalState);
  //   return this;
  // };
  //
  // /**
  //  * Immediately apply all updates in the update queue and notify components
  //  * that they need to re-render. Note that React will not re-render
  //  * synchronously.
  //  * @return The resulting state
  //  */
  // flushSync = (): StateType => {
  //   const prevState = this.#_state;
  //   let nextState;
  //   try {
  //     nextState = this.#_getNextStateSync();
  //   } catch (err) {
  //     this.emit('SetterException', err);
  //     return prevState;
  //   }
  //   // save final state result (a handler may have altered the final result)
  //   // then notify affected components
  //   this.#_notifyComponents(prevState, nextState);
  //   // _notifyComponents sets #_state equal to nextState,
  //   // and we return the new state here for convenience
  //   return this.#_state;
  // };
  //
  // /**
  //  * Reset a store to its initial condition and initial state values,
  //  *   and notifies all consumer components
  //  * @return  This store
  //  * @chainable
  //  */
  // reset = () => {
  //   this.resetState();
  //   this.#_hasInitialized = false;
  //   this.#_usedCount = 0;
  //   return this;
  // };
  //
  // /**
  //  * Reset the store to its initial state values
  //  *   and notifies all consumer components
  //  */
  // resetState = () => {
  //   this.setState(this.#_initialState);
  //   return this;
  // };
  //
  // /**
  //  * Reset the store at the given path to its initial state values
  //  *   and notifies all consumer components
  //  */
  // resetStateAt = (path: string) => {
  //   this.setStateAt(path, this.getInitialStateAt(path));
  //   return this;
  // };
  //
  // /**
  //  * Reset the store to its initial state values
  //  *   and synchronously notifies all consumer components
  //  */
  // resetSync = () => {
  //   this.setSync(this.#_initialState);
  //   return this;
  // };
  //
  // /**
  //  * Reset the store at the given path to its initial state values
  //  *   and synchronously notifies all consumer components
  //  */
  // resetSyncAt = (path: string) => {
  //   this.setStateAt(path, this.getInitialStateAt(path));
  //   return this;
  // };
  //
  // /**
  //  * Return a promise that will resolve once the store gets a new state
  //  * @return Resolves with the new state value
  //  */
  // nextState = (): Promise<StateType> => {
  //   return new Promise(resolve => {
  //     this.once('AfterUpdate', () => resolve(this.#_state));
  //   });
  // };
  //
  // /**
  //  * Return the number of components that "use" this store data
  //  */
  // getUsedCount = () => {
  //   return this.#_usedCount;
  // };
  //
  // /**
  //  * Return true if any component has ever used this store
  //  */
  // hasInitialized = () => {
  //   return this.#_hasInitialized;
  // };
  //
  // /**
  //  * Return the number of *mounted* components that "use" this store
  //  */
  // getMountCount = () => {
  //   return this.#_setters.length;
  // };
  //
  // /**
  //  * Register a plugin
  //  * @param initializer  The function the plugin uses to configure and attach itself
  //  * @return  The return value of the plugin initializer function
  //  */
  // plugin = (initializer: PluginFunctionType): any => {
  //   const result = initializer(this);
  //   this.#_plugins.push(initializer);
  //   return result;
  // };
  //
  // /**
  //  * Get the array of plugin initializer functions
  //  */
  // getPlugins = () => {
  //   return this.#_plugins;
  // };
  //
  // /**
  //  * Register a middleware function
  //  * @param middlewares  The middleware function to register
  //  * @return  This store
  //  */
  // use = (...middlewares: MiddlewareType<StateType>[]) => {
  //   this.#_middlewares.push(...middlewares);
  //   return this;
  // };
  //
  // /**
  //  * Run all the registered middleware
  //  * @private
  //  * @param context  Object with prev, next, isAsync, store
  //  * @param callback  The function to call when all middlewares have called "next()"
  //  */
  // #_runMiddlewares = (
  //   context: MiddlewareContextInterface<StateType>,
  //   callback: Function
  // ): void => {
  //   let i = 0;
  //   const done = () => {
  //     if (i === this.#_middlewares.length) {
  //       callback();
  //     } else {
  //       this.#_middlewares[i++](context, done);
  //     }
  //   };
  //   done();
  // };
  //
  // /**
  //  * Run all the registered middleware synchronously. Any middleware that does not
  //  * immediately call "next()" will cancel the update
  //  * @private
  //  * @param context  Object with prev, next, isAsync, store
  //  * @return  True unless middleware did not return right away
  //  */
  // #_runMiddlewaresSync = (
  //   context: MiddlewareContextInterface<StateType>
  // ): boolean => {
  //   let i = 0;
  //   const timesCalled = () => i++;
  //   for (const middleware of this.#_middlewares) {
  //     const lastI = i;
  //     middleware(context, timesCalled);
  //     if (lastI === i) {
  //       // middleware did not call "next"
  //       return false;
  //     }
  //   }
  //   return true;
  // };
  //
  // /**
  //  * Get a function that will tell connected components to re-render
  //  * @param prev  The previous state value
  //  * @param next  The next state value
  //  */
  // #_getComponentUpdater = (prev: StateType, next: StateType) => {
  //   return function _maybeSetState(setter: SetterType<StateType, any>) {
  //     if (
  //       typeof setter.mapState === 'function' &&
  //       typeof setter.equalityFn === 'function'
  //     ) {
  //       // registered from useStoreSelector so only re-render
  //       // components when the relevant slice of state changes
  //       const prevSelected = setter.mapState(prev);
  //       const nextSelected = setter.mapState(next);
  //       if (!setter.equalityFn(prevSelected, nextSelected)) {
  //         // the slice of state is not equal so rerender component
  //         setter.handler(nextSelected);
  //       }
  //     } else {
  //       // registered from useStoreState
  //       setter.handler(next);
  //     }
  //   };
  // };
  //
  // /**
  //  * Process the update queue and return a Promise that resolves to the new state
  //  */
  // #_getNextState = async (): Promise<StateType> => {
  //   let nextState = this.#_state;
  //   // process all updates or update functions
  //   // use while and shift in case setters trigger more setting
  //   const failsafeCascadeCount = 100;
  //   let failsafe = this.#_updateQueue.length + failsafeCascadeCount;
  //   while (this.#_updateQueue.length > 0) {
  //     /* istanbul ignore next @preserve */
  //     if (--failsafe === 0) {
  //       throw new Error(
  //         `react-thermals: Too many setState calls in queue; you probably have an infinite loop.`
  //       );
  //     }
  //     let updatedState = this.#_updateQueue.shift();
  //     if (updatedState instanceof Function) {
  //       updatedState = updatedState(nextState);
  //     }
  //     if (updatedState instanceof Promise) {
  //       try {
  //         updatedState = await updatedState;
  //       } catch (rejection) {
  //         this.emit('SetterException', rejection);
  //       }
  //     }
  //     nextState = updatedState;
  //   }
  //   return nextState;
  // };
  //
  // /**
  //  * Schedule updates for the next tick
  //  */
  // #_scheduleUpdates = (): void => {
  //   // Use Promise to queue state update for next tick
  //   // see https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/queueMicrotask
  //   Promise.resolve()
  //     .then(this.#_runUpdates)
  //     .catch(err => this.emit('SetterException', err));
  // };
  //
  // /**
  //  * Schedule updates for the next tick
  //  */
  // #_scheduleUpdatesWith = (nextState: StateType): void => {
  //   // Use Promise to queue state update for next tick
  //   // see https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/queueMicrotask
  //   Promise.resolve()
  //     .then(() => this.#_runUpdatesWith(nextState))
  //     .catch(err => this.emit('SetterException', err));
  // };
  //
  // /**
  //  * Run all queued updates and return a Promise that resolves to the new state
  //  */
  // #_runUpdates = async (): Promise<void> => {
  //   const prevState = this.#_state;
  //   const nextState = await this.#_getNextState();
  //   const context: MiddlewareContextInterface<StateType> = {
  //     prev: prevState,
  //     next: nextState,
  //     isAsync: true,
  //     store: this,
  //   };
  //   this.#_runMiddlewares(context, () => {
  //     // save final state result (a handler may have altered the final result)
  //     // then notify affected components
  //     this.#_notifyComponents(prevState, context.next);
  //   });
  // };
  //
  // /**
  //  * Run all queued updates and return a Promise that resolves to the new state
  //  */
  // #_runUpdatesSync = (): void => {
  //   const prevState = this.#_state;
  //   const nextState = this.#_getNextStateSync();
  //   const context: MiddlewareContextInterface<StateType> = {
  //     prev: prevState,
  //     next: nextState,
  //     isAsync: true,
  //     store: this,
  //   };
  //   this.#_runMiddlewares(context, () => {
  //     // save final state result (a handler may have altered the final result)
  //     // then notify affected components
  //     this.#_notifyComponents(prevState, context.next);
  //   });
  // };
  //
  // /**
  //  * Run all queued updates and return a Promise that resolves to the new state
  //  */
  // #_runUpdatesWithSync = (nextState: StateType): void => {
  //   const prevState = this.#_state;
  //   const context: MiddlewareContextInterface<StateType> = {
  //     prev: prevState,
  //     next: nextState,
  //     isAsync: true,
  //     store: this,
  //   };
  //   this.#_runMiddlewaresSync(context);
  //   this.#_notifyComponents(prevState, context.next);
  // };
  //
  // /**
  //  * Run all queued updates and return a Promise that resolves to the new state
  //  */
  // #_runUpdatesWith = async (nextState: StateType): Promise<void> => {
  //   const prevState = this.#_state;
  //   const context: MiddlewareContextInterface<StateType> = {
  //     prev: prevState,
  //     next: nextState,
  //     isAsync: true,
  //     store: this,
  //   };
  //   this.#_runMiddlewares(context, () => {
  //     // save final state result (a handler may have altered the final result)
  //     // then notify affected components
  //     this.#_notifyComponents(prevState, context.next);
  //   });
  // };
  //
  // /**
  //  * Tell connected components to re-render if applicable
  //  * @param prev  The previous state value
  //  * @param next  The new state value
  //  */
  // #_notifyComponents = (prev: StateType, next: StateType): void => {
  //   // save final state result
  //   this.#_state = next;
  //   // update components with no selector or with matching selector
  //   this.#_setters.forEach((setter: SetterType<StateType, any>) => {
  //     this.#_getComponentUpdater(prev, this.#_state)(setter);
  //   });
  //   // announce the final state
  //   this.emit('AfterUpdate', { prev, next: this.#_state });
  // };
  //
  // /**
  //  * Process the update queue synchronously and return the new state
  //  * Note that any updater functions that return promises will be queued for later update.
  //  * @return The new state OR the previous state if updating was blocked
  //  */
  // #_getNextStateSync = (): StateType => {
  //   let prev = this.#_state;
  //   let next = this.#_state;
  //   // process all updates or update functions
  //   // use while and shift in case setters trigger more setting
  //   const failsafeCascadeCount = 100;
  //   let failsafe = this.#_updateQueue.length + failsafeCascadeCount;
  //   while (this.#_updateQueue.length > 0) {
  //     /* istanbul ignore next @preserve */
  //     if (--failsafe === 0) {
  //       throw new Error(
  //         `react-thermals: Too many setState calls in queue; probably an infinite loop.`
  //       );
  //     }
  //     const updatedState = this.#_updateQueue.shift();
  //     if (updatedState instanceof Function) {
  //       const maybeNext = updatedState(next);
  //       if (maybeNext instanceof Promise) {
  //         // we want to call all state mutator functions synchronously,
  //         // but we have a mutator that returned a Promise, so we need
  //         // to circle back and set state after the Promise resolves
  //         maybeNext
  //           .then(this.setState)
  //           .catch((err: Error) => this.emit('SetterException', err));
  //       } else {
  //         next = maybeNext;
  //       }
  //     } else if (updatedState instanceof Promise) {
  //       // we want to call all state synchronously
  //       // but the returned state is a Promise, so we need
  //       // to circle back and set state after the Promise resolves
  //       updatedState
  //         .then(this.setState)
  //         .catch((err: Error) => this.emit('SetterException', err));
  //     } else {
  //       next = updatedState;
  //     }
  //   }
  //   const context = {
  //     prev,
  //     next,
  //     isAsync: false,
  //     store: this,
  //   };
  //   const shouldContinue = this.#_runMiddlewaresSync(context);
  //   if (shouldContinue) {
  //     return context.next;
  //   } else {
  //     return prev;
  //   }
  // };

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
