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
        constructor(context?: any);
        _handlers: {};
        _context: any;
        on(type: any, handler: any): void;
        off(type: any, handler: any): void;
        once(type: any, handler: any): void;
        emit(type: any, data?: any): PreventableEvent | {
            type: any;
            data: any;
        };
    }
    import PreventableEvent from "src/PreventableEvent/PreventableEvent";
}
declare module "src/createStore/createStore" {
    /**
     * Creates a new store
     * @param {Object} [config] - An object containing the store setup
     * @property {Object} [config.state] - The store's initial state. It can be of any type.
     * @property {Object} [config.actions] - Named functions that can be dispatched by name and payload
     * @property {Object} [config.options] - Metadata maintained by the store that does not trigger re-renders
     * @property {Boolean} [config.autoReset] - If true, reset the store when all consumer components unmount
     * @property {String} [config.id] - The id string for debugging
     * @return {Object} store - Info and methods for working with the store
     * @property {Function} store.getState - Return the current state value
     * @property {Object} store.actions - Methods that can be called to affect state
     * @property {Function} store.setState - function to set a new state value
     * @property {Function} store.mergeState - function to set a new state value
     * @property {Function<Promise>} store.nextState - function that returns a Promise that resolves on next state value
     * @property {Function} store.reset - Reset the store's state to its original value
     * @property {Function} store.plugin - Pass a plugin to extend the store's functionality
     * @property {String} store.id - The id or number of the store
     * @property {Number} store.idx - The index order of the store in order of definition
     * @property {Function} store._subscribe - A method to add a setState callback that should be notified on changes
     * @property {Function} store._unsubscribe - A method to remove a setState callback
     * @property {Number} store._usedCount - The number of components that have ever used this store
     */
    export default function createStore({ state: initialState, actions, options: _options, autoReset, id, }?: any): any;
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
    export default function getMapperFunction(mapState: any): any;
}
declare module "src/useStoreSelector/useStoreSelector" {
    /**
     * @param {Object} store - A store created with createStore()
     * @param {Function|String|String[]} [mapState] - Function that returns a slice of data
     * @param {Function} [equalityFn] - Custom equality function that checks if state has change
     * @return {Object} - tools for working with the store
     * @property {*} state - The value in the store
     * @property {Object} actions - functions defined by createStore
     * @property {Function} reset - function to reset the store's state to its initial value
     * @property {Function} nextState - function that returns a Promise that resolves on next state value
     */
    export default function useStoreSelector(store: any, mapState?: Function | string | string[], equalityFn?: Function): any;
}
declare module "src/useStoreState/useStoreState" {
    /**
     * @param {Object} store - A store created with createStore()
     * @return {Object} - tools for working with the store
     * @property {*} state - The value in the store
     * @property {Object} actions - functions defined by createStore
     * @property {Function} reset - function to reset the store's state to its initial value
     * @property {Function} nextState - function that returns a Promise that resolves on next state value
     */
    export default function useStoreState(store: any): any;
}
declare module "src/createSetter/createSetter" {
    /**
     * Helper function to create a mergeState function that directly sets one property
     * @param {String|Number} propName  The name of the property to merge
     * @return {Function}  A function suitable for passing to store.setState()
     */
    export function fieldSetter(propName: string | number): Function;
    /**
     * Helper function to create a mergeState function that directly sets one or more properties
     * @param {String[]|Number[]} propNames  The name of the property to merge
     * @return {Function}  A function suitable for passing to store.setState()
     */
    export function fieldListSetter(propNames: string[] | number[]): Function;
    /**
     * Helper function to create a mergeState function that directly toggles one property
     * @param {String|Number} propName  The name of the property to toggle
     * @return {Function}  A function suitable for passing to store.setState()
     */
    export function fieldToggler(propName: string | number): Function;
    /**
     * Helper function to create a mergeState function that adds the given amount to one property
     * e.g. use amount = 1 to create an incrementer function and amount = -1 for a decremeter function
     * @param {String|Number} propName  The name of the property to toggle
     * @return {Function}  A function suitable for passing to store.setState()
     */
    export function fieldAdder(propName: string | number, amount: any): Function;
    /**
     * Helper function to create a mergeState function that appends and item to an array property
     * @param {String|Number} propName  The name of the array property to append to
     * @return {Function}  A function suitable for passing to store.setState()
     */
    export function fieldAppender(propName: string | number): Function;
    /**
     * Helper function to create a mergeState function that removes the given item from an array property
     * @param {String|Number} propName  The name of the array property to remove from
     * @return {Function}  A function suitable for passing to store.setState()
     */
    export function fieldRemover(propName: string | number): Function;
    /**
     * Helper function to create a mergeState function that runs a mapping against an array property
     * @param {String|Number} propName  The name of the array property to map
     * @return {Function}  A function suitable for passing to store.setState()
     */
    export function fieldMapper(propName: string | number): Function;
}
declare module "index" {
    import createStore from "src/createStore/createStore";
    import useStoreSelector from "src/useStoreSelector/useStoreSelector";
    import useStoreState from "src/useStoreState/useStoreState";
    import { fieldSetter } from "src/createSetter/createSetter";
    import { fieldListSetter } from "src/createSetter/createSetter";
    import { fieldToggler } from "src/createSetter/createSetter";
    import { fieldAdder } from "src/createSetter/createSetter";
    import { fieldAppender } from "src/createSetter/createSetter";
    import { fieldRemover } from "src/createSetter/createSetter";
    import { fieldMapper } from "src/createSetter/createSetter";
    export { createStore, useStoreSelector, useStoreState, fieldSetter, fieldListSetter, fieldToggler, fieldAdder, fieldAppender, fieldRemover, fieldMapper };
}
