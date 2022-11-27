import Store from './classes/Store/Store';
import PreventableEvent from './classes/PreventableEvent/PreventableEvent';

export type EventNameType =
  | 'BeforeFirstUse'
  | 'AfterFirstUse'
  | 'AfterFirstMount'
  | 'AfterMount'
  | 'AfterUnmount'
  | 'AfterLastUnmount'
  | 'BeforeSet'
  | 'BeforeUpdate'
  | 'AfterUpdate'
  | 'BeforeReset'
  | 'AfterReset'
  | 'BeforePlugin'
  | 'AfterPlugin'
  | 'SetterException'
  | '*';

export type EventHandlerType = (evt: PreventableEvent) => void;

export type EventHandlerOrHandlersType = EventHandlerType | EventHandlerType[];

export type StoreConfigHandlersType = {
  BeforeFirstUse?: EventHandlerOrHandlersType;
  AfterFirstUse?: EventHandlerOrHandlersType;
  AfterFirstMount?: EventHandlerOrHandlersType;
  AfterMount?: EventHandlerOrHandlersType;
  AfterUnmount?: EventHandlerOrHandlersType;
  AfterLastUnmount?: EventHandlerOrHandlersType;
  BeforeSet?: EventHandlerOrHandlersType;
  BeforeUpdate?: EventHandlerOrHandlersType;
  AfterUpdate?: EventHandlerOrHandlersType;
  BeforeReset?: EventHandlerOrHandlersType;
  AfterReset?: EventHandlerOrHandlersType;
  BeforePlugin?: EventHandlerOrHandlersType;
  AfterPlugin?: EventHandlerOrHandlersType;
  SetterException?: EventHandlerOrHandlersType;
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
