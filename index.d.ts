declare module "src/PreventableEvent/PreventableEvent" {
    export default class PreventableEvent {
        constructor(target: any, type: any, data: any);
        target: any;
        type: any;
        data: any;
        defaultPrevented: boolean;
        propagationStopped: boolean;
        preventDefault(): void;
        stopPropagation(): void;
        stopImmediatePropagation(): void;
        isPropagationStopped(): boolean;
    }
}
declare module "src/Emitter/Emitter" {
    export default class Emitter {
        on(type: any, handler: any): Emitter;
        off(type: any, handler: any): Emitter;
        once(type: any, handler: any): Emitter;
        emit(type: any, data?: any): PreventableEvent | {
            type: any;
            data: any;
        };
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
declare module "src/Store/Store" {
    export default class Store extends Emitter {
        constructor({ state: initialState, actions, options, autoReset, id, }?: {
            state?: {};
            actions?: {};
            options?: {};
            autoReset?: boolean;
            id?: any;
        });
        actions: {};
        id: string;
        getState: () => {};
        addActions: (actions: any) => Store;
        setState: (newState: any) => Store;
        mergeSync: (newState: any) => void;
        setSync: (newState: any) => Store;
        mergeState: (newState: any) => Store;
        flushSync: () => {};
        clone: (overrides?: {}) => Store;
        reset: (withOverrides?: any) => Store;
        nextState: () => Promise<any>;
        getUsedCount: () => number;
        hasInitialized: () => boolean;
        getMountCount: () => number;
        getOptions: () => {};
        getOption: (name: any) => any;
        setOptions: (newOptions: any) => Store;
        setOption: (name: any, newValue: any) => Store;
        plugin: (initializer: any) => {
            initialized: boolean;
            result: any;
        };
        getPlugins: () => any[];
        use: (...middlewares: any[]) => Store;
        _subscribe: (setState: any) => void;
        _unsubscribe: (setState: any) => void;
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
declare module "src/selectPath/selectPath" {
    /**
     * Build a function that will return state at a certain path
     * @param {String} path  Path string such as "cart" or "cart.total"
     * @return {Function}
     */
    export default function selectPath(path: string): Function;
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
    import Store from "src/Store/Store";
    import useStoreSelector from "src/useStoreSelector/useStoreSelector";
    import useStoreState from "src/useStoreState/useStoreState";
    export { Store, useStoreSelector, useStoreState };
}
