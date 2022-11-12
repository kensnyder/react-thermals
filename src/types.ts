import Store from './class/Store/Store';
import PreventableEvent from './class/PreventableEvent/PreventableEvent';

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

export type EventHandlerType = (evt: PreventableEvent) => void;

export type EventHandlerOrHandlersType = EventHandlerType | EventHandlerType[];

export type StoreConfigHandlersType = {
  BeforeInitialState?: EventHandlerOrHandlersType;
  AfterFirstUse?: EventHandlerOrHandlersType;
  AfterFirstMount?: EventHandlerOrHandlersType;
  AfterMount?: EventHandlerOrHandlersType;
  AfterUnmount?: EventHandlerOrHandlersType;
  AfterLastUnmount?: EventHandlerOrHandlersType;
  SetterException?: EventHandlerOrHandlersType;
  BeforeSet?: EventHandlerOrHandlersType;
  BeforeUpdate?: EventHandlerOrHandlersType;
  AfterUpdate?: EventHandlerOrHandlersType;
  BeforeReset?: EventHandlerOrHandlersType;
  AfterReset?: EventHandlerOrHandlersType;
  BeforePlugin?: EventHandlerOrHandlersType;
  AfterPlugin?: EventHandlerOrHandlersType;
  '*'?: EventHandlerOrHandlersType;
};

export type StoreConfigType = {
  state?: any;
  actions?: Record<string, Function>;
  options?: PlainObjectType;
  on?: StoreConfigHandlersType;
  autoReset?: boolean;
  id?: string;
};

export interface MiddlewareContextInterface {
  prev: any;
  next: any;
  isAsync: boolean;
  store: Store;
}

export type PluginFunctionType = (store: Store) => any;

export type PluginResultType = {
  initialized: boolean;
  result: any;
};

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
