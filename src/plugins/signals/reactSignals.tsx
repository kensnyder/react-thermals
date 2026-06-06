import { type FC, type ReactNode, useEffect, useReducer } from 'react';
import Store from '../../classes/Store/Store';

// see https://github.com/tc39/proposal-signals for details about signal behavior
export type Setter<T> = (newValue: T | ((old: T) => T)) => void;
export type Getter<T> = () => T;

export type ReadonlySignal<T> = {
  Value: FC;
  get: Getter<T>;
  /** Read current value without registering a dependency. */
  peek: Getter<T>;
  store: Store<T>;
};

export type Signal<T> = ReadonlySignal<T> & {
  set: Setter<T>;
};

/** Returned by createComputed — writable only internally, exposes dispose(). */
export type ComputedSignal<T> = ReadonlySignal<T> & {
  dispose: () => void;
};

// depth counter so nested untrack() calls are re-entrant
let frozenDepth = 0;
// stack of dependency-tracking Sets for nested computeds/effects
const computingStack: Array<Set<Store<any>>> = [];
// batch state: pending store writes flushed at the outermost batch exit
let batchDepth = 0;
const pendingBatchUpdates = new Map<Store<any>, any>();

function resolveCurrentValue<T>(store: Store<T>): T {
  if (batchDepth > 0 && pendingBatchUpdates.has(store)) {
    return pendingBatchUpdates.get(store) as T;
  }
  return store.getState() as T;
}

/**
 * Defer all signal writes inside fn until the outermost batch exits.
 * Effects and computeds only see fully-committed state when they run,
 * preventing partial-update reads. Nested batch() calls are supported.
 */
export function batch(fn: () => void): void {
  batchDepth++;
  try {
    fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      const updates = [...pendingBatchUpdates];
      pendingBatchUpdates.clear();
      for (const [store, value] of updates) {
        store.setState(value);
      }
    }
  }
}

export function createSignal<T>(defaultValue: T | (() => T)): Signal<T> {
  const initialValue =
    typeof defaultValue === 'function'
      ? (defaultValue as () => T)()
      : defaultValue;
  const store = new Store<T>(initialValue);
  if (typeof window === 'undefined') {
    return {
      Value: () => <>{initialValue as ReactNode}</>,
      set: _newValue => {},
      get: () => initialValue,
      peek: () => initialValue,
      store,
    } as Signal<T>;
  }

  const Value: FC = () => {
    const [, reRender] = useReducer(x => x + 1, 0);
    useEffect(() => {
      store.on('AfterUpdate', reRender);
      return () => {
        store.off('AfterUpdate', reRender);
      };
    }, []);
    return <>{store.getState() as ReactNode}</>;
  };
  Value.displayName = 'SignalValue';

  const peek: Getter<T> = () => {
    const value = resolveCurrentValue(store);
    if (value instanceof Error) throw value;
    return value as T;
  };

  const get: Getter<T> = () => {
    const current = computingStack[computingStack.length - 1];
    if (frozenDepth === 0 && current) {
      current.add(store);
    }
    return peek();
  };

  const set: Setter<T> = (newValue: T | ((old: T) => T)) => {
    if (frozenDepth > 0) {
      throw new Error('Cannot set signal while frozen');
    }
    const current = resolveCurrentValue(store);
    const value =
      typeof newValue === 'function'
        ? (newValue as (old: T) => T)(current)
        : newValue;
    if (batchDepth > 0) {
      pendingBatchUpdates.set(store, value);
    } else {
      store.setState(value);
    }
  };

  return { Value, set, get, peek, store };
}

export type ComputedCallback<T> = () => T;

export function createComputed<T>(
  compute: ComputedCallback<T>,
  options: {
    equals?: (a: T, b: T) => boolean;
  } = {}
): ComputedSignal<T> {
  const equals = options.equals ?? Object.is;
  const signal = createSignal<T>(undefined as unknown as T);
  let lastValue: T | Error;
  const subscribedStores = new Set<Store<any>>();

  const runEffect = () => {
    subscribedStores.forEach(s => {
      s.off('AfterUpdate', runEffect);
    });
    subscribedStores.clear();

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

    tracking.forEach(s => {
      s.on('AfterUpdate', runEffect);
      subscribedStores.add(s);
    });
  };

  runEffect();

  const dispose = () => {
    subscribedStores.forEach(s => {
      s.off('AfterUpdate', runEffect);
    });
    subscribedStores.clear();
  };

  return {
    Value: signal.Value,
    get: signal.get,
    peek: signal.peek,
    store: signal.store,
    dispose,
  };
}

/**
 * Run a callback immediately and re-run it whenever any signal it reads changes.
 * The callback may return a teardown function called before each re-run and on dispose.
 * Returns a dispose function that cleans up all subscriptions.
 */
export function effect(callback: () => (() => void) | void): () => void {
  const subscribedStores = new Set<Store<any>>();
  let teardown: (() => void) | void;

  const run = () => {
    if (teardown) {
      teardown();
      teardown = undefined;
    }
    subscribedStores.forEach(s => {
      s.off('AfterUpdate', run);
    });
    subscribedStores.clear();

    const tracking = new Set<Store<any>>();
    computingStack.push(tracking);

    try {
      teardown = callback();
    } finally {
      computingStack.pop();
    }

    tracking.forEach(s => {
      s.on('AfterUpdate', run);
      subscribedStores.add(s);
    });
  };

  run();

  return () => {
    if (teardown) teardown();
    subscribedStores.forEach(s => {
      s.off('AfterUpdate', run);
    });
    subscribedStores.clear();
  };
}

/**
 * Read signals inside a callback without registering them as dependencies.
 * Calls are re-entrant; throws if signal.set() is called inside.
 */
export function untrack<T>(callback: () => T): T {
  frozenDepth++;
  try {
    return callback();
  } finally {
    frozenDepth--;
  }
}

/**
 * Subscribe a React component to a signal and return its current value.
 * Re-renders whenever the signal changes. Unlike <signal.Value />, this works
 * for non-primitive values and enables conditional rendering based on signal state.
 */
export function useSignalValue<T>(signal: ReadonlySignal<T>): T {
  const [, reRender] = useReducer(x => x + 1, 0);
  useEffect(() => {
    signal.store.on('AfterUpdate', reRender);
    return () => {
      signal.store.off('AfterUpdate', reRender);
    };
  }, [signal.store]);
  return signal.peek();
}
