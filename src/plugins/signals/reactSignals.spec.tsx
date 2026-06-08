import '@testing-library/jest-dom';
import { describe, expect, it, mock } from 'bun:test';
import { act, render } from '@testing-library/react';
import Store from '../../classes/Store/Store';
import {
  batch,
  createComputed,
  createSignal,
  effect,
  untrack,
  useSignalValue,
} from './reactSignals';

// Helper: wait for the next async tick(s)
const nextTick = () => new Promise<void>(r => setTimeout(r, 0));

describe('createSignal()', () => {
  it('should return a Signal with Value, set, get, and store', () => {
    const signal = createSignal(0);
    expect(typeof signal.get).toBe('function');
    expect(typeof signal.set).toBe('function');
    expect(typeof signal.Value).toBe('function');
    expect(signal.store).toBeInstanceOf(Store);
  });

  it('should accept a primitive initial value', () => {
    const signal = createSignal(42);
    expect(signal.get()).toBe(42);
  });

  it('should accept a string initial value', () => {
    const signal = createSignal('hello');
    expect(signal.get()).toBe('hello');
  });

  it('should accept a function as initializer', () => {
    const signal = createSignal(() => 99);
    expect(signal.get()).toBe(99);
  });

  it('should accept an object as initial value', () => {
    const state = { count: 1 };
    const signal = createSignal(state);
    expect(signal.get()).toBe(state);
  });

  it('should update value via set() with a direct value', () => {
    const signal = createSignal(1);
    signal.set(2);
    expect(signal.get()).toBe(2);
  });

  it('should update value via set() with a function updater', () => {
    const signal = createSignal(10);
    signal.set(old => old + 5);
    expect(signal.get()).toBe(15);
  });

  it('should chain set() calls with function updaters', () => {
    const signal = createSignal(1);
    signal.set(old => old + 1);
    signal.set(old => old * 3);
    expect(signal.get()).toBe(6);
  });

  it('should have a store whose getState matches get()', () => {
    const signal = createSignal('test');
    expect(signal.store.getState()).toBe('test');
    signal.set('updated');
    expect(signal.store.getState()).toBe('updated');
    expect(signal.get()).toBe('updated');
  });

  it('should set displayName on Value component', () => {
    const signal = createSignal(0);
    expect(signal.Value.displayName).toBe('SignalValue');
  });

  it('should render Value component with initial value', () => {
    const signal = createSignal('world');
    const { container } = render(<signal.Value />);
    expect(container.textContent).toBe('world');
  });

  it('should render Value component with a number', () => {
    const signal = createSignal(7);
    const { container } = render(<signal.Value />);
    expect(container.textContent).toBe('7');
  });

  it('should update Value component when signal changes', async () => {
    const signal = createSignal(1);
    const { container } = render(<signal.Value />);
    expect(container.textContent).toBe('1');
    await act(async () => {
      signal.set(99);
      await signal.store.nextState();
    });
    expect(container.textContent).toBe('99');
  });

  it('should update Value component multiple times', async () => {
    const signal = createSignal('a');
    const { container } = render(<signal.Value />);

    await act(async () => {
      signal.set('b');
      await signal.store.nextState();
    });
    expect(container.textContent).toBe('b');

    await act(async () => {
      signal.set('c');
      await signal.store.nextState();
    });
    expect(container.textContent).toBe('c');
  });

  it('should unsubscribe Value component on unmount', async () => {
    const signal = createSignal(0);
    const { container, unmount } = render(<signal.Value />);
    unmount();
    signal.set(1);
    await signal.store.nextState();
    // No errors thrown; component properly cleaned up
    expect(container.textContent).toBe('');
  });

  it('should work in SSR mode when window is undefined', () => {
    const originalWindow = globalThis.window;
    try {
      // @ts-expect-error
      globalThis.window = undefined;
      const signal = createSignal(55);
      // get() returns the initial value
      expect(signal.get()).toBe(55);
      // set() is a no-op
      signal.set(100);
      expect(signal.get()).toBe(55);
      // store is still a Store instance
      expect(signal.store).toBeInstanceOf(Store);
    } finally {
      globalThis.window = originalWindow;
    }
  });

  it('should return a Value component in SSR mode', () => {
    const originalWindow = globalThis.window;
    try {
      // @ts-expect-error
      globalThis.window = undefined;
      const signal = createSignal('ssr-content');
      // In SSR mode, Value is a simple FC (no hooks); just verify it exists
      expect(typeof signal.Value).toBe('function');
      // Verify the no-op set doesn't change the value
      signal.set('other');
      expect(signal.get()).toBe('ssr-content');
    } finally {
      globalThis.window = originalWindow;
    }
  });
});

describe('untrack()', () => {
  it('should return the callback result', () => {
    expect(untrack(() => 42)).toBe(42);
  });

  it('should return a string result', () => {
    expect(untrack(() => 'abc')).toBe('abc');
  });

  it('should allow reading signals without registering dependencies', async () => {
    const counter = createSignal(0);
    const multiplier = createSignal(10);
    const spy = mock();

    const cleanup = effect(() => {
      const c = counter.get();
      const m = untrack(() => multiplier.get());
      spy(c * m);
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(0);

    // changing multiplier (untracked) should NOT re-run effect
    multiplier.set(20);
    await multiplier.store.nextState();
    await nextTick();
    expect(spy).toHaveBeenCalledTimes(1);

    // changing counter (tracked) should re-run; reads updated multiplier
    counter.set(1);
    await counter.store.nextState();
    await nextTick();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(20);

    cleanup();
  });

  it('should restore frozen state even if callback throws', () => {
    const signal = createSignal(0);
    expect(() => {
      untrack(() => {
        throw new Error('inside untrack');
      });
    }).toThrow('inside untrack');
    // frozen should be restored; set() should work again
    expect(() => signal.set(1)).not.toThrow();
    expect(signal.get()).toBe(1);
  });
});

describe('effect()', () => {
  it('should run the callback immediately on creation', () => {
    const spy = mock();
    const signal = createSignal(0);
    const cleanup = effect(() => {
      spy(signal.get());
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(0);
    cleanup();
  });

  it('should re-run when a tracked signal changes', async () => {
    const signal = createSignal(0);
    const spy = mock();

    const cleanup = effect(() => spy(signal.get()));

    signal.set(1);
    await signal.store.nextState();
    await nextTick();

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(1);
    cleanup();
  });

  it('should track multiple signals', async () => {
    const a = createSignal(1);
    const b = createSignal(10);
    const spy = mock();

    const cleanup = effect(() => spy(a.get() + b.get()));

    expect(spy).toHaveBeenLastCalledWith(11);

    a.set(2);
    await a.store.nextState();
    await nextTick();
    expect(spy).toHaveBeenLastCalledWith(12);

    b.set(20);
    await b.store.nextState();
    await nextTick();
    expect(spy).toHaveBeenLastCalledWith(22);

    cleanup();
  });

  it('should stop re-running after cleanup', async () => {
    const signal = createSignal(0);
    const spy = mock();

    const cleanup = effect(() => spy(signal.get()));
    expect(spy).toHaveBeenCalledTimes(1);

    cleanup();

    signal.set(1);
    await signal.store.nextState();
    await nextTick();

    expect(spy).toHaveBeenCalledTimes(1); // no additional calls
  });

  it('should update tracked dependencies when they change between runs', async () => {
    const toggle = createSignal(true);
    const a = createSignal('A');
    const b = createSignal('B');
    const spy = mock();

    const cleanup = effect(() => {
      spy(toggle.get() ? a.get() : b.get());
    });

    expect(spy).toHaveBeenLastCalledWith('A');

    // switch toggle to track b instead of a
    toggle.set(false);
    await toggle.store.nextState();
    await nextTick();
    expect(spy).toHaveBeenLastCalledWith('B');

    // changing a should NOT re-run (no longer tracked)
    const callCount = spy.mock.calls.length;
    a.set('A2');
    await a.store.nextState();
    await nextTick();
    expect(spy.mock.calls.length).toBe(callCount);

    // changing b should re-run
    b.set('B2');
    await b.store.nextState();
    await nextTick();
    expect(spy).toHaveBeenLastCalledWith('B2');

    cleanup();
  });

  it('should return a cleanup function that is callable', () => {
    const signal = createSignal(0);
    const cleanup = effect(() => {
      signal.get();
    });
    expect(typeof cleanup).toBe('function');
    expect(() => cleanup()).not.toThrow();
  });
});

describe('createComputed()', () => {
  it('should return a ComputedSignal with get, peek, dispose, Value, and store', () => {
    const a = createSignal(1);
    const computed = createComputed(() => a.get() * 2);
    expect(typeof computed.get).toBe('function');
    expect(typeof computed.peek).toBe('function');
    expect(typeof computed.dispose).toBe('function');
    expect(typeof computed.Value).toBe('function');
    expect(computed.store).toBeInstanceOf(Store);
  });

  it('should compute the initial value immediately', () => {
    const a = createSignal(3);
    const b = createSignal(4);
    const sum = createComputed(() => a.get() + b.get());
    expect(sum.get()).toBe(7);
  });

  it('should recompute when a dependency changes', async () => {
    const base = createSignal(2);
    const doubled = createComputed(() => base.get() * 2);
    expect(doubled.get()).toBe(4);

    base.set(5);
    await base.store.nextState();
    await nextTick();

    expect(doubled.get()).toBe(10);
  });

  it('should recompute when any of multiple dependencies change', async () => {
    const x = createSignal(1);
    const y = createSignal(2);
    const product = createComputed(() => x.get() * y.get());
    expect(product.get()).toBe(2);

    x.set(3);
    await x.store.nextState();
    await nextTick();
    expect(product.get()).toBe(6);

    y.set(4);
    await y.store.nextState();
    await nextTick();
    expect(product.get()).toBe(12);
  });

  it('should chain computed signals', async () => {
    const base = createSignal(2);
    const doubled = createComputed(() => base.get() * 2);
    const quadrupled = createComputed(() => doubled.get() * 2);

    expect(quadrupled.get()).toBe(8);

    base.set(3);
    await base.store.nextState(); // base AfterUpdate → doubled recomputes
    await nextTick(); // doubled AfterUpdate → quadrupled recomputes
    await nextTick(); // quadrupled AfterUpdate settles

    expect(quadrupled.get()).toBe(12);
  });

  it('should use Object.is as the default equality check', async () => {
    const signal = createSignal(1);
    const computed = createComputed(() => signal.get());

    // The initial runEffect queues a computed.store AfterUpdate; let it settle
    await nextTick();

    const spy = mock();
    const cleanup = effect(() => spy(computed.get()));
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockClear();

    // same value: Object.is(1, 1) === true → computed does not update → spy not called
    signal.set(1);
    await signal.store.nextState();
    await nextTick();
    expect(spy).toHaveBeenCalledTimes(0);

    // different value → computed updates → spy called
    signal.set(2);
    await signal.store.nextState();
    await nextTick();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(2);

    cleanup();
  });

  it('should skip update when custom equals returns true', async () => {
    const signal = createSignal(1);
    // consider equal if within 5
    const computed = createComputed(() => signal.get(), {
      equals: (a, b) => Math.abs(a - b) <= 5,
    });
    expect(computed.get()).toBe(1);

    signal.set(4); // |1-4|=3 ≤ 5 → equal, no update
    await signal.store.nextState();
    await nextTick();
    expect(computed.get()).toBe(1);
  });

  it('should update when custom equals returns false', async () => {
    const signal = createSignal(1);
    const computed = createComputed(() => signal.get(), {
      equals: (a, b) => Math.abs(a - b) <= 5,
    });
    expect(computed.get()).toBe(1);

    signal.set(10); // |1-10|=9 > 5 → not equal, update
    await signal.store.nextState();
    await nextTick();
    expect(computed.get()).toBe(10);
  });

  it('should never update when custom equals always returns true', async () => {
    const signal = createSignal('initial');
    const computed = createComputed(() => signal.get(), {
      equals: () => true,
    });

    // equals() => true compares lastValue(undefined) with 'initial' and returns true,
    // so the computed store is never set — even on the first run.
    expect(computed.get()).toBeUndefined();

    signal.set('changed');
    await signal.store.nextState();
    await nextTick();

    // still undefined: equals always returns true, blocking all updates
    expect(computed.get()).toBeUndefined();
  });

  it('should propagate errors thrown in the compute function', async () => {
    const signal = createSignal(1);
    const computed = createComputed(() => {
      const val = signal.get();
      if (val < 0) throw new Error('negative!');
      return val;
    });
    expect(computed.get()).toBe(1);

    signal.set(-1);
    await signal.store.nextState();
    await nextTick();

    expect(() => computed.get()).toThrow('negative!');
  });

  it('should recover from errors when dependency changes to valid value', async () => {
    const signal = createSignal(1);
    const computed = createComputed(() => {
      const val = signal.get();
      if (val < 0) throw new Error('negative!');
      return val;
    });

    signal.set(-1);
    await signal.store.nextState();
    await nextTick();
    expect(() => computed.get()).toThrow('negative!');

    signal.set(5);
    await signal.store.nextState();
    await nextTick();
    expect(computed.get()).toBe(5);
  });

  it('should render Value with the computed result', () => {
    const count = createSignal(7);
    const label = createComputed(() => `Count is ${count.get()}`);
    const { container } = render(<label.Value />);
    expect(container.textContent).toBe('Count is 7');
  });

  it('should update Value when recomputed', async () => {
    const count = createSignal(1);
    const doubled = createComputed(() => count.get() * 2);

    // Wait for initial pending AfterUpdate to settle before rendering
    await nextTick();

    const { container } = render(<doubled.Value />);
    expect(container.textContent).toBe('2');

    await act(async () => {
      count.set(5);
      await count.store.nextState(); // count AfterUpdate → doubled recomputes
      await nextTick(); // doubled AfterUpdate → Value re-renders
    });
    expect(container.textContent).toBe('10');
  });
});

describe('signal.peek()', () => {
  it('should return the current value', () => {
    const signal = createSignal(42);
    expect(signal.peek()).toBe(42);
  });

  it('should reflect updates from set()', () => {
    const signal = createSignal(1);
    signal.set(99);
    expect(signal.peek()).toBe(99);
  });

  it('should not register as a dependency inside effect()', async () => {
    const a = createSignal(0);
    const b = createSignal(10);
    const spy = mock();

    const cleanup = effect(() => {
      const aVal = a.get(); // tracked
      const bVal = b.peek(); // NOT tracked
      spy(aVal + bVal);
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(10);

    // changing b (peeked) should NOT re-run effect
    b.set(20);
    await b.store.nextState();
    await nextTick();
    expect(spy).toHaveBeenCalledTimes(1);

    // changing a (tracked) should re-run; reads updated b value
    a.set(1);
    await a.store.nextState();
    await nextTick();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(21);

    cleanup();
  });

  it('should not register as a dependency inside createComputed()', async () => {
    const a = createSignal(5);
    const b = createSignal(10);
    const computed = createComputed(() => a.get() + b.peek());

    expect(computed.get()).toBe(15);

    // changing b (peeked) should NOT trigger recompute
    b.set(20);
    await b.store.nextState();
    await nextTick();
    expect(computed.get()).toBe(15);

    // changing a (tracked) should recompute; reads updated b
    a.set(1);
    await a.store.nextState();
    await nextTick();
    expect(computed.get()).toBe(21);

    computed.dispose();
  });

  it('should throw if the underlying value is an Error', async () => {
    const signal = createSignal(1);
    const errored = createComputed(() => {
      if (signal.get() < 0) throw new Error('negative');
      return signal.get();
    });
    signal.set(-1);
    await signal.store.nextState();
    await nextTick();
    expect(() => errored.peek()).toThrow('negative');
    errored.dispose();
  });
});

describe('batch()', () => {
  it('should apply all writes before effects run', async () => {
    const x = createSignal(0);
    const y = createSignal(0);
    const seen: Array<[number, number]> = [];

    const cleanup = effect(() => {
      seen.push([x.get(), y.get()]);
    });
    seen.length = 0; // discard initial run

    batch(() => {
      x.set(1);
      y.set(2);
    });

    await x.store.nextState();
    await nextTick();

    // every recorded snapshot should show both values committed
    for (const [xv, yv] of seen) {
      expect(xv).toBe(1);
      expect(yv).toBe(2);
    }

    cleanup();
  });

  it('should make pending writes visible to get() inside the batch', () => {
    const count = createSignal(0);

    batch(() => {
      count.set(5);
      expect(count.get()).toBe(5);
    });
  });

  it('should support functional updaters chained inside a batch', () => {
    const count = createSignal(0);

    batch(() => {
      count.set(n => n + 1);
      count.set(n => n + 1);
    });

    expect(count.get()).toBe(2);
  });

  it('should support nested batch() calls, flushing on the outermost exit', () => {
    const a = createSignal(0);
    const b = createSignal(0);

    batch(() => {
      a.set(1);
      batch(() => {
        b.set(2);
        expect(a.get()).toBe(1);
        expect(b.get()).toBe(2);
      });
      // still inside outer batch; stores not yet committed
      expect(a.store.getState()).toBe(0);
    });
    // after outermost exit
    expect(a.store.getState()).toBe(1);
    expect(b.store.getState()).toBe(2);
  });

  it('should commit all values even if batch fn throws', () => {
    const x = createSignal(0);

    try {
      batch(() => {
        x.set(7);
        throw new Error('mid-batch error');
      });
    } catch (_) {}

    expect(x.store.getState()).toBe(7);
  });
});

describe('effect() teardown', () => {
  it('should call the returned teardown before re-running', async () => {
    const signal = createSignal(0);
    const teardownSpy = mock();

    const cleanup = effect(() => {
      signal.get(); // track
      return teardownSpy;
    });

    expect(teardownSpy).toHaveBeenCalledTimes(0);

    signal.set(1);
    await signal.store.nextState();
    await nextTick();

    // teardown called before the re-run
    expect(teardownSpy).toHaveBeenCalledTimes(1);

    cleanup();
  });

  it('should call the returned teardown on dispose', () => {
    const signal = createSignal(0);
    const teardownSpy = mock();

    const dispose = effect(() => {
      signal.get();
      return teardownSpy;
    });

    dispose();
    expect(teardownSpy).toHaveBeenCalledTimes(1);
  });

  it('should not call teardown if callback returns undefined', async () => {
    const signal = createSignal(0);
    const spy = mock(() => undefined);

    const cleanup = effect(() => {
      signal.get();
      spy();
      // no return value
    });

    signal.set(1);
    await signal.store.nextState();
    await nextTick();

    expect(() => cleanup()).not.toThrow();
    cleanup();
  });

  it('should clean up async resources via teardown', async () => {
    const signal = createSignal('a');
    const aborted: string[] = [];

    const cleanup = effect(() => {
      const val = signal.get();
      const controller = { aborted: false, abort: () => aborted.push(val) };
      return () => controller.abort();
    });

    signal.set('b');
    await signal.store.nextState();
    await nextTick();
    // teardown for 'a' fired before re-run for 'b'
    expect(aborted).toEqual(['a']);

    cleanup();
    expect(aborted).toEqual(['a', 'b']);
  });
});

describe('createComputed() dispose()', () => {
  it('should stop recomputing after dispose()', async () => {
    const base = createSignal(1);
    const computed = createComputed(() => base.get() * 2);
    expect(computed.get()).toBe(2);

    computed.dispose();

    base.set(5);
    await base.store.nextState();
    await nextTick();

    // value is stale — computed stopped tracking
    expect(computed.get()).toBe(2);
  });

  it('should not throw when dispose() is called multiple times', () => {
    const base = createSignal(0);
    const computed = createComputed(() => base.get());
    expect(() => {
      computed.dispose();
      computed.dispose();
    }).not.toThrow();
  });
});

describe('untrack() nesting', () => {
  it('should not prevent signal mutation inside nested untrack() calls', () => {
    const signal = createSignal(0);
    expect(() => {
      untrack(() => {
        untrack(() => {
          signal.set(1);
        });
      });
    }).not.toThrow();
    expect(signal.get()).toBe(1);
  });

  it('should correctly disable dependency tracking during nested untrack calls', () => {
    const base = createSignal(0);
    const computed = createComputed(() => {
      return untrack(() => {
        return untrack(() => {
          return base.get();
        });
      });
    });

    expect(computed.get()).toBe(0);
    base.set(1);

    // Dependency tracking was disabled, so computed should not update when base changes
    expect(computed.get()).toBe(0);
  });
});

describe('useSignalValue()', () => {
  it('should return the current signal value', () => {
    const signal = createSignal('hello');
    function Comp() {
      const val = useSignalValue(signal);
      return <span>{val}</span>;
    }
    const { container } = render(<Comp />);
    expect(container.textContent).toBe('hello');
  });

  it('should re-render the component when the signal changes', async () => {
    const signal = createSignal(1);

    function Comp() {
      const val = useSignalValue(signal);
      return <span>{val}</span>;
    }

    const { container } = render(<Comp />);
    expect(container.textContent).toBe('1');

    await act(async () => {
      signal.set(42);
      await signal.store.nextState();
    });

    expect(container.textContent).toBe('42');
  });

  it('should unsubscribe on unmount', async () => {
    const signal = createSignal(0);
    let renderCount = 0;

    function Comp() {
      renderCount++;
      const val = useSignalValue(signal);
      return <span>{val}</span>;
    }

    const { unmount } = render(<Comp />);
    const countBeforeUnmount = renderCount;

    unmount();

    signal.set(99);
    await signal.store.nextState();
    await nextTick();

    expect(renderCount).toBe(countBeforeUnmount);
  });

  it('should work with object-valued signals for conditional rendering', async () => {
    const session = createSignal<{ name: string } | null>(null);

    function Comp() {
      const user = useSignalValue(session);
      return <span>{user ? user.name : 'logged out'}</span>;
    }

    const { container } = render(<Comp />);
    expect(container.textContent).toBe('logged out');

    await act(async () => {
      session.set({ name: 'Alice' });
      await session.store.nextState();
    });

    expect(container.textContent).toBe('Alice');
  });
});
