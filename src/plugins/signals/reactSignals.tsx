import { type FC, type ReactNode, useSyncExternalStore } from 'react';
import Store from '../../classes/Store/Store';

// see https://github.com/tc39/proposal-signals for details about signal behavior
export type Setter<T> = (newValue: T | ((old: T) => T)) => void;
export type Getter<T> = () => T;

export type ReadonlySignal<T> = {
  Value: FC;
  get: Getter<T>;
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

// depth counter so nested untrack() calls are re-entrant for reads
let untrackDepth = 0;
// flag to prevent setting signals during compute
let isComputing = false;
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
 *
 * Note (Architectural Limitation): If you modify a dependency inside a batch
 * and immediately call get() on a computed that relies on it, the computed
 * will return a stale value because the dependency's AfterUpdate event
 * hasn't fired yet. Do not read derived computations inside the same
 * synchronous batch where their dependencies are modified.
 */
export function batch(fn: () => void): void {
  batchDepth++;
  try {
    fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      const updates = [...pendingBatchUpdates];

      // Temporarily mock batch depth so synchronous listeners triggered
      // by setState can still resolve pending values via resolveCurrentValue
      batchDepth++;
      for (const [store, value] of updates) {
        store.setState(value);
      }
      batchDepth--;

      pendingBatchUpdates.clear();
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
    const value = useSyncExternalStore(
      callback => {
        store.on('AfterUpdate', callback);
        return () => {
          store.off('AfterUpdate', callback);
        };
      },
      () => store.getState()
    );
    return <>{value as ReactNode}</>;
  };
  Value.displayName = 'SignalValue';

  const peek: Getter<T> = () => {
    const value = resolveCurrentValue(store);
    if (value instanceof Error) throw value;
    return value as T;
  };

  const get: Getter<T> = () => {
    const current = computingStack[computingStack.length - 1];
    if (untrackDepth === 0 && current) {
      current.add(store);
    }
    return peek();
  };

  const set: Setter<T> = (newValue: T | ((old: T) => T)) => {
    if (isComputing) {
      throw new Error('Cannot set signal during compute');
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
      isComputing = true;
      newValue = compute();
      isComputing = false; // Release lock BEFORE signal.set()
      if (lastValue instanceof Error || !equals(lastValue as T, newValue)) {
        lastValue = newValue;
        signal.set(newValue);
      }
    } catch (e) {
      isComputing = false;
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

  if (currentRoot) {
    currentRoot.add(dispose);
  }

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

  const dispose = () => {
    if (teardown) teardown();
    subscribedStores.forEach(s => {
      s.off('AfterUpdate', run);
    });
    subscribedStores.clear();
  };

  if (currentRoot) {
    currentRoot.add(dispose);
  }

  return dispose;
}

/**
 * Read signals inside a callback without registering them as dependencies.
 * Calls are re-entrant; throws if signal.set() is called inside.
 */
export function untrack<T>(callback: () => T): T {
  untrackDepth++;
  try {
    return callback();
  } finally {
    untrackDepth--;
  }
}

/**
 * Subscribe a React component to a signal and return its current value.
 * Re-renders whenever the signal changes. Unlike <signal.Value />, this works
 * for non-primitive values and enables conditional rendering based on signal state.
 */
export function useSignalValue<T>(signal: ReadonlySignal<T>): T {
  return useSyncExternalStore(
    callback => {
      signal.store.on('AfterUpdate', callback);
      return () => {
        signal.store.off('AfterUpdate', callback);
      };
    },
    () => signal.peek()
  );
}

let currentRoot: Set<() => void> | null = null;

/**
 * Creates a reactive root that manages the lifecycle of computeds and effects.
 * Call the provided dispose function to clean up all reactive subscriptions
 * created within the callback.
 */
export function createRoot<T>(fn: (dispose: () => void) => T): T {
  const root = new Set<() => void>();
  const parentRoot = currentRoot;
  currentRoot = root;

  const dispose = () => {
    root.forEach(cleanup => {
      cleanup();
    });
    root.clear();
  };

  try {
    return fn(dispose);
  } finally {
    currentRoot = parentRoot;
  }
}
