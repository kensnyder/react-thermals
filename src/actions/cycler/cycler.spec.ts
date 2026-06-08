import { describe, expect, it } from 'bun:test';
import Store from '../../classes/Store/Store';
import cycler from './cycler';

describe('cycler()', () => {
  it('should handle 1 value', () => {
    const store = new Store({ color: 'black' });
    const cycleColor = store.connect('color', cycler(['black']));
    cycleColor();
    expect(store.getState()).toEqual({ color: 'black' });
  });
  it('should handle 2 values', () => {
    const store = new Store({ color: 'black' });
    const cycleColor = store.connect('color', cycler(['black', 'red']));
    cycleColor();
    expect(store.getState()).toEqual({ color: 'red' });
    cycleColor();
    expect(store.getState()).toEqual({ color: 'black' });
  });
  it('should handle 2 values with invalid starting value', () => {
    // @ts-expect-error Testing an invalid init value
    const store = new Store<{ color: 'black' | 'red' }>({ color: null });
    const cycleColor = store.connect('color', cycler(['black', 'red']));
    cycleColor();
    expect(store.getState()).toEqual({ color: 'black' });
    cycleColor();
    expect(store.getState()).toEqual({ color: 'red' });
  });
  it('should handle 3 values', () => {
    const store = new Store({ color: 'red' });
    const cycleColor = store.connect('color', cycler(['black', 'red', 'blue']));
    cycleColor();
    expect(store.getState()).toEqual({ color: 'blue' });
    cycleColor();
    expect(store.getState()).toEqual({ color: 'black' });
  });
});
