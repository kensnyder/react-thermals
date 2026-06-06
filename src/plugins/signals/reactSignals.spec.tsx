import '@testing-library/jest-dom';
import { act, render } from '@testing-library/react';
import { describe, expect, it, mock } from 'bun:test';
import Store from '../../classes/Store/Store';
import { createComputed, createSignal, effect, untrack } from './reactSignals';

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

  it('should throw when set() is called inside untrack()', () => {
    const signal = createSignal(0);
    expect(() => {
      untrack(() => {
        signal.set(1);
      });
    }).toThrow('Cannot set signal while frozen');
  });

  it('should work in SSR mode when window is undefined', () => {
    const originalWindow = globalThis.window;
    try {
      // @ts-ignore
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
      // @ts-ignore
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
    const cleanup = effect(() => signal.get());
    expect(typeof cleanup).toBe('function');
    expect(() => cleanup()).not.toThrow();
  });
});

describe('createComputed()', () => {
  it('should return a Signal', () => {
    const a = createSignal(1);
    const computed = createComputed(() => a.get() * 2);
    expect(typeof computed.get).toBe('function');
    expect(typeof computed.set).toBe('function');
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
