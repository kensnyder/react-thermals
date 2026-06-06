import { type FC, type ReactNode, useEffect, useReducer } from 'react';
import Store from '../../classes/Store/Store';

// see https://github.com/tc39/proposal-signals for details about signal behavior
export type Setter<T> = (newValue: T | ((old: T) => T)) => void;
export type Getter<T> = () => T;
export type Signal<T> = {
  Value: FC;
  set: Setter<T>;
  get: Getter<T>;
  store: Store<T>;
};
// used to allow reading without triggering listeners
let frozen = false;
// stack of dependency-tracking Sets for nested computeds
const computingStack: Array<Set<Store<any>>> = [];

export function createSignal<T>(defaultValue: T | (() => T)): Signal<T> {
  const initialValue =
    typeof defaultValue === 'function'
      ? (defaultValue as () => T)()
      : defaultValue;
  const store = new Store<T>(initialValue);
  if (typeof window === 'undefined') {
    return {
      Value: () => <>{initialValue as ReactNode}</>,
      set: (_newValue) => {},
      get: () => initialValue,
      store,
    } as Signal<T>;
  }

  const Value: FC = () => {
    const [, reRender] = useReducer((x) => x + 1, 0);
    useEffect(() => {
      store.on('AfterUpdate', reRender);
      return () => {
        store.off('AfterUpdate', reRender);
      };
    }, []);
    return <>{store.getState() as ReactNode}</>;
  };
  Value.displayName = 'SignalValue';

  const get: Getter<T> = () => {
    const current = computingStack[computingStack.length - 1];
    if (!frozen && current) {
      current.add(store);
    }
    const value = store.getState();
    if (value instanceof Error) {
      throw value;
    }
    return value as T;
  };

  const set: Setter<T> = (newValue: T | ((old: T) => T)) => {
    if (frozen) {
      throw new Error('Cannot set signal while frozen');
    }
    const value =
      typeof newValue === 'function'
        ? (newValue as (old: T) => T)(store.getState())
        : newValue;
    store.setState(value);
  };
  return { Value, set, get, store };
}

export type ComputedCallback<T> = () => T;

export function createComputed<T>(
  compute: ComputedCallback<T>,
  options: {
    equals?: (a: T, b: T) => boolean;
  } = {},
) {
  const equals = options.equals ?? Object.is;
  const signal = createSignal<T>(undefined as unknown as T);
  let lastValue: T | Error;
  const subscribedStores = new Set<Store<any>>();

  const runEffect = () => {
    // Unsubscribe old dependencies before re-running
    subscribedStores.forEach((s) => {
      s.off('AfterUpdate', runEffect);
    });
    subscribedStores.clear();

    // Push a new tracking Set onto the stack for this computation
    const tracking = new Set<Store<any>>();
    computingStack.push(tracking);

    let newValue: T | Error;
    try {
      newValue = compute();
      if (lastValue instanceof Error || !equals(lastValue as T, newValue)) {
        lastValue = newValue;
        signal.set(newValue);
      }
    } catch (e) {
      newValue = e as Error;
      lastValue = newValue;
      // @ts-expect-error Internally it is ok to set signal to an Error
      signal.set(newValue);
    } finally {
      computingStack.pop();
    }

    // Subscribe to newly discovered dependencies
    tracking.forEach((s) => {
      s.on('AfterUpdate', runEffect);
      subscribedStores.add(s);
    });
  };

  runEffect();
  return signal;
}

/**
 * Run a callback immediately and re-run it whenever any signal it reads changes.
 * Returns a cleanup function that disposes the effect.
 */
export function effect(callback: () => any): () => void {
  const subscribedStores = new Set<Store<any>>();

  const run = () => {
    // Unsubscribe old dependencies before re-running
    subscribedStores.forEach((s) => {
      s.off('AfterUpdate', run);
    });
    subscribedStores.clear();

    const tracking = new Set<Store<any>>();
    computingStack.push(tracking);

    try {
      callback();
    } finally {
      computingStack.pop();
    }

    tracking.forEach((s) => {
      s.on('AfterUpdate', run);
      subscribedStores.add(s);
    });
  };

  run();

  return () => {
    subscribedStores.forEach((s) => {
      s.off('AfterUpdate', run);
    });
    subscribedStores.clear();
  };
}

/**
 * Read signals inside a callback without registering them as dependencies.
 */
export function untrack<T>(callback: () => T): T {
  frozen = true;
  try {
    return callback();
  } finally {
    frozen = false;
  }
}
