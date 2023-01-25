import Store from './classes/Store/Store';
import PreventableEvent from './classes/PreventableEvent/PreventableEvent';
import { Get } from 'type-fest';

export type EventNameType =
  | 'BeforeFirstUse'
  | 'AfterFirstUse'
  | 'AfterFirstMount'
  | 'AfterMount'
  | 'AfterUnmount'
  | 'AfterLastUnmount'
  | 'AfterUpdate'
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
  AfterUpdate?: EventHandlerOrHandlersType;
  SetterException?: EventHandlerOrHandlersType;
  '*'?: EventHandlerOrHandlersType;
};

export type StoreConfigType<StateType = any> = {
  state?: StateType;
  actions?: Record<string, Function>;
  options?: PlainObjectType;
  on?: StoreConfigHandlersType;
  autoReset?: boolean;
  id?: string;
};

export interface MiddlewareContextInterface<StateType> {
  prev: StateType;
  next: StateType;
  isAsync: boolean;
  store: Store;
}

export type MiddlewareType<StateType> = (
  context: MiddlewareContextInterface<StateType>,
  next: Function
) => StateType;

export type PluginFunctionType = (store: Store) => any;

export type SetterType = {
  handler: Function;
  mapState?: Function;
  equalityFn?: Function;
};

export type PlainObjectType = Record<string, any>;

export type SettableStateType<StateType> =
  | StateType
  | Promise<StateType>
  | ((newState: StateType) => StateType)
  | ((newState: StateType) => Promise<StateType>);

export type MergeableStateType<StateType> =
  | Partial<StateType>
  | Promise<Partial<StateType>>
  | ((newState: StateType) => Partial<StateType>)
  | ((newState: StateType) => Promise<Partial<StateType>>);

export type StateMapperType = undefined | null | Function | string;

export type StateMapperOrMappersType = StateMapperType | StateMapperType[];

export type SelectByStringType<StateType> = Get<
  StateType,
  string,
  { strict: true }
>;

export type SelectByFunctionType<StateType> =
  | StateType
  | Partial<StateType>
  | any;

export type SelectedStateType<StateType> =
  | SelectByStringType<StateType>
  | SelectByStringType<StateType>[]
  | SelectByFunctionType<StateType>;

// TODO: types for intellisense on Action functions
