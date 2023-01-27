import Store from './classes/Store/Store';
import React from 'react';
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

export type EventDataType<StateType, EventName> = EventName extends
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
  target: Store<StateType>;
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
  isAsync: boolean;
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

export type StateMapperType<StateType, Mapped> =
  | ((fullState: StateType) => Mapped)
  | string;

export type StateMapperOrMappersType<StateType, Mapped> =
  | undefined
  | null
  | StateMapperType<StateType, Mapped>
  | StateMapperType<StateType, Mapped>[];

export type SelectedByStringType<StateType> = Get<
  StateType,
  string,
  { strict: true }
>;
