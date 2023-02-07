import Store from './classes/Store/Store';
import React from 'react';
import { Get } from 'type-fest';
import SimpleEmitter from './classes/SimpleEmitter/SimpleEmitter';

export type EventNameType =
  | 'BeforeInitialize'
  | 'AfterInitialize'
  | 'BeforeFirstUse'
  | 'AfterFirstUse'
  | 'AfterFirstMount'
  | 'AfterMount'
  | 'AfterUnmount'
  | 'AfterLastUnmount'
  | 'AfterUpdate'
  | 'SetterException'
  | '*';

export type EventDataType<StateType, EventName> = EventName extends
  | 'BeforeInitialize'
  | 'AfterInitialize'
  | 'BeforeFirstUse'
  | 'AfterFirstUse'
  ? StateType
  : EventName extends 'AfterMount' | 'AfterUnmount'
  ? number
  : EventName extends 'AfterUpdate'
  ? { prev: StateType; next: StateType }
  : EventName extends 'SetterException'
  ? Error
  : undefined;

export type EventType<StateType, EventName> = {
  target: SimpleEmitter<StateType> | Store<StateType>;
  type: EventName;
  data: EventDataType<StateType, EventName>;
};

export type EventHandlerType<StateType, EventName> = (
  evt: EventType<StateType, EventName>
) => void;

export type StoreConfigType = {
  autoReset?: boolean;
  id?: string;
};

export interface MiddlewareContextInterface<StateType> {
  prev: StateType;
  next: StateType;
  isAsync?: boolean;
  store: Store<StateType>;
}

export type MiddlewareType<StateType> = (
  context: MiddlewareContextInterface<StateType>,
  next: Function
) => StateType;

export type PluginFunctionType = (store: Store) => any;

export type SetterType<StateType, SelectedState> = {
  handler: React.Dispatch<StateType>;
  mapState?: (fullState: StateType) => SelectedState;
  equalityFn?: (prev: SelectedState, next: SelectedState) => boolean;
};

export type PlainObjectType = Record<string, any>;

export type StateAtType<Path extends string, StateType> = Get<
  StateType,
  Path,
  { strict: false }
>;

export type FunctionStateType<StateType> =
  | ((oldState: StateType) => StateType)
  | ((oldState: StateType) => Promise<StateType>);

export type SettableStateType<StateType> =
  | StateType
  | Promise<StateType>
  | FunctionStateType<StateType>;

export type FunctionStateAtType<Path extends string, StateType> = (
  oldState: StateAtType<Path, StateType>
) => StateAtType<Path, StateType>;

export type SettableStateAtPathType<Path extends string, StateType> =
  | StateAtType<Path, StateType>
  | Promise<StateAtType<Path, StateType>>
  | FunctionStateAtType<Path, StateType>
  | ((
      oldState: StateAtType<Path, StateType>
    ) => Promise<StateAtType<Path, StateType>>);

export type MergeableStateType<StateType> =
  | Partial<StateType>
  | Promise<Partial<StateType>>
  | ((oldState: StateType) => Partial<StateType>)
  | ((oldState: StateType) => Promise<Partial<StateType>>);

export type MergeableStateAtPathType<Path extends string, StateType> =
  | Partial<StateAtType<Path, StateType>>
  | Promise<Partial<StateAtType<Path, StateType>>>
  | ((
      oldState: StateAtType<Path, StateType>
    ) => Partial<StateAtType<Path, StateType>>)
  | ((
      oldState: StateAtType<Path, StateType>
    ) => Promise<Partial<StateAtType<Path, StateType>>>);

export type ExtendStateAtPathType<Path extends string, StateType> = Partial<
  Get<StateType, Path, { strict: false }>
>;

export type StateMapperType<StateType, Mapped> =
  | ((fullState: StateType) => Mapped)
  | string;

export type StateMapperOrMappersType<StateType, Mapped> =
  | undefined
  | null
  | StateMapperType<StateType, Mapped>
  | StateMapperType<StateType, Mapped>[];
