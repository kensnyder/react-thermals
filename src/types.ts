import Store from './Store/Store';
import PreventableEvent from './PreventableEvent/PreventableEvent';

export type EventNameType =
  | 'BeforeInitialState'
  | 'AfterFirstUse'
  | 'AfterFirstMount'
  | 'AfterMount'
  | 'AfterUnmount'
  | 'AfterLastUnmount'
  | 'SetterException'
  | 'BeforeSet'
  | 'BeforeUpdate'
  | 'AfterUpdate'
  | 'BeforeReset'
  | 'AfterReset'
  | 'BeforePlugin'
  | 'AfterPlugin'
  | '*';

export type EventHandlerOrHandlersType = EventHandlerType | EventHandlerType[];

export type StoreConfigType = {
  state?: any;
  actions?: Record<string, Function>;
  options?: PlainObjectType;
  on?: Record<EventNameType, EventHandlerOrHandlersType>;
  autoReset?: boolean;
  id?: string;
};

export interface MiddlewareContextInterface {
  prev: any;
  next: any;
  isAsync: boolean;
  store: Store;
}

export type PluginResultType = {
  initialized: boolean;
  result: any;
};

export type PluginFunctionType = (store: Store) => any;

export type EventHandlerType = (evt: PreventableEvent) => void;

export type SetterType = {
  handler: Function;
  mapState?: Function;
  equalityFn?: Function;
};

export type PlainObjectType = Record<string, any>;

export type MergeableStateType =
  | PlainObjectType
  | ((newState: PlainObjectType) => PlainObjectType);

export type MergeableStateAsyncType =
  | MergeableStateType
  | Promise<PlainObjectType>;
