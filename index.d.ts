declare module "src/PreventableEvent/PreventableEvent" {
    /**
     * Object representing an event that fires from Store.emit()
     */
    export default class PreventableEvent {
        /**
         * @param {Store} target  The store that created the event
         * @param {String} type  The event name
         * @param {any} data  Any data associated with the event
         */
        constructor(target: Store, type: string, data: any);
        target: Store;
        type: string;
        data: any;
        defaultPrevented: boolean;
        propagationStopped: boolean;
        /**
         * Prevent the default behavior of this event
         */
        preventDefault(): void;
        /**
         * Prevent other handlers from running
         */
        stopPropagation(): void;
        /**
         * Prevent other handlers from running
         */
        stopImmediatePropagation(): void;
        /**
         * Check if some handlers were skipped
         * @return {Boolean}
         */
        isPropagationStopped(): boolean;
    }
}
declare module "src/Emitter/Emitter" {
    export default class Emitter {
        /**
         * Add an event listener
         * @param {String} type  The event name
         * @param {Function} handler  The function to be called when the event fires
         * @return {Emitter}
         */
        on(type: string, handler: Function): Emitter;
        /**
         * Remove an event listener
         * @param {String} type  The event name
         * @param {Function} handler  The function registered with "on()" or "once()"
         * @return {Emitter}
         */
        off(type: string, handler: Function): Emitter;
        /**
         * Add an event listener that should fire once and only once
         * @param {String} type  The event name
         * @param {Function} handler  The function to be called when the event fires
         * @return {Emitter}
         */
        once(type: string, handler: Function): Emitter;
        /**
         * Trigger handlers attached to the given event with the given data
         * @param {String} type  The event name
         * @param {any} data  The data to pass to evt.data
         * @return {PreventableEvent}  Returns the event object that was passed to handlers
         * @property isDefaultPrevented  Read to tell if event was canceled
         */
        emit(type: string, data?: any): PreventableEvent;
        #private;
    }
    import PreventableEvent from "src/PreventableEvent/PreventableEvent";
}
declare module "src/shallowCopy/shallowCopy" {
    /**
     * Copy a value shallowly
     * @param {*} value  Any value, but often an object
     * @return {*}  A copy of the value
     */
    export default function shallowCopy(value: any): any;
}
declare module "src/shallowOverride/shallowOverride" {
    /**
     * Create a copy of the given value, shallowly overriding properties
     * @param {*} value  The value to copy
     * @param {*} overrides  Override values to extend the copy
     * @return {*}
     */
    export default function shallowOverride(value: any, overrides: any): any;
}
declare module "src/updatePath/getUpdateRunner" {
    /**
     * Build a function that accepts a value or a setState handler that receives
     *   the old state value and returns the new state value. Used by updatePath
     * @param {Function|Function[]|undefined} transform  Some examples:
     *   Add one to the old state: getUpdateRunner(old => old + 1)
     *   Add to the old state: getUpdateRunner((old, addend) => old + addend)
     *   Append an item: getTranformerRunner((old, newItem) => ([...old, newItem]))
     *   Allow transforming later: getUpdateRunner(undefined)
     * @return {Function}
     * @throws {Error} if transform is not a valid type
     */
    export default function getUpdateRunner(transform: Function | Function[] | undefined): Function;
}
declare module "src/updatePath/updatePath" {
    /**
     * Deep updater takes a path and a transformer and returns a function
     *   that will take in an object and return a copy of that object
     *   with that transform applied to the value at "path"
     * @param {String} path
     * @param {Function|Function[]|undefined} transform
     * @return {Function}
     */
    export function updatePath(path: string, transform?: Function | Function[] | undefined): Function;
}
declare module "src/selectPath/selectPath" {
    /**
     * Build a function that will return state at a certain path
     * @param {String} path  Path string such as "cart" or "cart.total"
     * @return {Function}
     */
    export default function selectPath(path: string): Function;
}
declare module "src/Store/Store" {
    export default class Store extends Emitter {
        /**
         * Create a new store with the given state and actions
         * @param {any} initialState  The store's initial state; it can be of any type
         * @param {Record<String, Function>} actions  Named functions that can be dispatched by name and arguments
         * @param {Record<String, any>} options  Options that setters, plugins or event listeners might look for
         * @param {Boolean} autoReset  True to reset state after all components unmount
         * @param {String} id  An identifier that could be used by plugins or event listeners
         */
        constructor({ state: initialState, actions, options, autoReset, id, }?: any);
        /**
         * The actions that interact with the store
         * @type {Record<string, function>}
         */
        actions: Record<string, Function>;
        /**
         * A string to identify the store by
         * @type {String}
         */
        id: string;
        /**
         * Return the current state of the store
         * @return {any}
         */
        getState: () => any;
        /**
         * Return the current state of the store
         * @return {any}
         */
        getStateAt: (path: any) => any;
        /**
         * Add functions that operate on state
         * @param {Record<String, Function>} actions
         * @return {Record<String, Function>}
         */
        addActions: (actions: Record<string, Function>) => Record<string, Function>;
        /**
         * Schedule state to be updated in the next batch of updates
         * @param {Function|any} newState  The new value or function that will return the new value
         * @return {Store}
         */
        setState: (newState: Function | any) => Store;
        /**
         * Schedule state to be merged in the next batch of updates
         * @param {Function|Object} newState  The value to merge or function that will return value to merge
         * @return {Store}
         */
        mergeState: (newState: Function | any) => Store;
        /**
         * Schedule state to be merged in the next batch of updates
         * @param {Object} moreState  The values to merge into the state (components will not be notified)
         * @return {Store}
         */
        extendState: (moreState: any) => Store;
        /**
         * Immediately update the state to the given value
         * @param {Function|any} newState  The new value or function that will return the new value
         * @return {Store}
         */
        setSync: (newState: Function | any) => Store;
        /**
         * Immediately merge the state with the given value
         * @param {Function|Object} newState  The value to merge or function that will return value to merge
         * @return {Store}
         */
        mergeSync: (newState: Function | any) => Store;
        /**
         * Schedule a value to be updated in the next batch of updates at the given path inside the state
         * @param {String} path  The path to the value
         * @param {Function|any} newStateOrUpdater  The new value or a function that receives "oldState" as a first parameter
         */
        setStateAt: (path: string, newStateOrUpdater: Function | any) => void;
        /**
         * Immediately update a value at the given path inside the state
         * @param {String} path  The path to the value
         * @param {Function|any} newStateOrUpdater  The new value or a function that receives "oldState" as a first parameter
         */
        setSyncAt: (path: string, newStateOrUpdater: Function | any) => void;
        /**
         * Immediately apply all updates in the update queue and notify components
         * that they need to re-render. Note that React will not re-render
         * synchronously.
         * @return {any}  The resulting state
         */
        flushSync: () => any;
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
        clone: (withOverrides?: any) => Store;
        /**
         * Reset a store to its initial state
         * @param {any} withOverrides  Additional state to override
         * @return {Store}
         */
        reset: (withOverrides?: any) => Store;
        /**
         * Return a promise that will resolve once the store gets a new state
         * @return {Promise<any>}  Resolves with the new state  value
         */
        nextState: () => Promise<any>;
        /**
         * Return the number of components that "use" this store data
         * @return {Number}
         */
        getUsedCount: () => number;
        /**
         * Return true if any component has ever used this store
         * @return {Boolean}
         */
        hasInitialized: () => boolean;
        /**
         * Return the number of *mounted* components that "use" this store
         * @return {number}
         */
        getMountCount: () => number;
        /**
         * Get all the store options
         * @return {Object}
         */
        getOptions: () => any;
        /**
         * Get a single store option
         * @param {String} name  The name of the option
         * @return {*}
         */
        getOption: (name: string) => any;
        /**
         * Set store options
         * @param {Object} newOptions
         * @return {Store}
         */
        setOptions: (newOptions: any) => Store;
        /**
         * Set a single store option
         * @param {String} name  The name of the option
         * @param {any} newValue  The value to set
         * @return {Store}
         */
        setOption: (name: string, newValue: any) => Store;
        /**
         * Register a plugin. Note that a handler attached to BeforePlugin can prevent the plugin from getting attached
         * @param {Function} initializer  The function the plugin uses to configure and attach itself
         * @return {Object}
         * @property {Boolean} initialized  True if the plugin was successfully registered
         * @property {any} result  The return value of the plugin initializer function
         */
        plugin: (initializer: Function) => any;
        /**
         * Get the array of plugin initializer functions
         * @return {Array}
         */
        getPlugins: () => any[];
        /**
         * Register a middleware function
         * @param {Function} middlewares  The middleware function to register
         * @return {Store}
         */
        use: (...middlewares: Function) => Store;
        /**
         * Connect a component to the store so that when relevant state changes, the component will be re-rendered
         * @param {Function} setState  A setState function from React.useState()
         * @note private but used by useStoreSelector()
         */
        _subscribe: (setState: Function) => void;
        /**
         * Disconnect a component from the store
         * @param {Function} setState  The setState function used to _subscribe
         * @note private but used by useStoreSelector()
         */
        _unsubscribe: (setState: Function) => void;
        #private;
    }
    import Emitter from "src/Emitter/Emitter";
}
declare module "src/defaultEqualityFn/defaultEqualityFn" {
    /**
     * A default way to check if two slices of state are equal
     * Used to determine if a component should rerender or not
     * @param {*} prev - The previous value of the state
     * @param {*} next - The next value of the state
     * @return {Boolean} - True if values are shallowly equal
     */
    export default function defaultEqualityFn(prev: any, next: any): boolean;
}
declare module "src/getMapperFunction/getMapperFunction" {
    /**
     * Return a function that derives information from state
     * @param {String|Number|Array|Function|null|undefined} mapState  One of the following:
     *   String with a property name or path (e.g. 'user' or 'user.permission')
     *   Number for root state that is just an array
     *   Array of mapState values
     *   Function that is already a mapperFunction
     *   null|undefined to return the full state
     * @return {Function}
     */
    export default function getMapperFunction(mapState: string | number | any[] | Function | null | undefined): Function;
}
declare module "src/useStoreSelector/useStoreSelector" {
    /**
     * @param {Object} store - A store created with createStore()
     * @param {Function|String|String[]} [mapState] - Function that returns a slice of data
     * @param {Function} [equalityFn] - Custom equality function that checks if state has change
     * @return {*} - The selected
     */
    export default function useStoreSelector(store: any, mapState?: Function | string | string[], equalityFn?: Function): any;
}
declare module "src/useStoreState/useStoreState" {
    /**
     * @param {Store} store - An instance of Store
     * @return {Object} - The entire state value that will rerender the host
     *   Component when the state value changes
     */
    export default function useStoreState(store: Store): any;
}
declare module "index" {
    export * as Store from "src/Store/Store";
    export * as useStoreSelector from "src/useStoreSelector/useStoreSelector";
    export * as useStoreState from "src/useStoreState/useStoreState";
    export * as selectPath from "src/selectPath/selectPath";
    export * as shallowCopy from "src/shallowCopy/shallowCopy";
    export * as updatePath from "src/updatePath/updatePath";
}
