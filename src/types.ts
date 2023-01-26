import Store from './classes/Store/Store';
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

export type EventType = {
  target: Store;
  type: EventNameType;
  data?: any;
};

export type EventHandlerType = (evt: EventType) => void;

export type StoreConfigType = {
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

// export type SettableAtType =

// const get = <StateType, Path extends string>(object: StateType, path: Path): Get<StateType, Path> =>
// 	lodash.get(object, path);

export type MergeableStateType<StateType> =
  | Partial<StateType>
  | Promise<Partial<StateType>>
  | ((newState: StateType) => Partial<StateType>)
  | ((newState: StateType) => Promise<Partial<StateType>>);

// export type MergeableAtType =

export type StateMapperType = undefined | null | Function | string;

export type StateMapperOrMappersType = StateMapperType | StateMapperType[];

export type SelectedByStringType<StateType> = Get<
  StateType,
  string,
  { strict: true }
>;

export type SelectByFunctionType<StateType> =
  | StateType
  | Partial<StateType>
  | any;

export type SelectedStateType<StateType> =
  | SelectedByStringType<StateType>
  | SelectedByStringType<StateType>[]
  | SelectByFunctionType<StateType>;

// TODO: types for intellisense on Action functions
