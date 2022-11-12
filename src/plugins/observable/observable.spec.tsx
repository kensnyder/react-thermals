import React, { FunctionComponent, MouseEventHandler } from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Store from '../../class/Store/Store';
import observable from './observable';
import useStoreState from '../../hooks/useStoreState/useStoreState';
import { vitest } from 'vitest';

describe('observable()', () => {
  let store: Store;
  let CountComponent: FunctionComponent;
  beforeEach(() => {
    store = new Store({
      state: 0,
      actions: {
        increment() {
          store.setState((old: number) => old + 1);
        },
        thrower() {
          store.setState(() => {
            throw new Error('my error');
          });
        },
      },
    });
    store.plugin(observable());
    CountComponent = () => {
      const state = useStoreState(store);
      const { increment, thrower } = store.actions;
      return (
        <div className="Count">
          <span title="count">{state}</span>
          <button onClick={thrower as MouseEventHandler}>throw</button>
          <button onClick={increment as MouseEventHandler}>+1</button>
        </div>
      );
    };
  });
  it('should fire on change', async () => {
    const observer = { next: vitest.fn() };
    store.subscribe(observer);
    store.actions.increment();
    await store.nextState();
    expect(store.getState()).toBe(1);
    expect(observer.next).toHaveBeenCalledWith(1);
  });
  it('should fire on user actions', async () => {
    const observer = {
      next: vitest.fn(),
      complete: vitest.fn(),
      error: vitest.fn(),
    };
    store.subscribe(observer);
    const { getByText, getByTitle, unmount } = render(<CountComponent />);
    await act(() => {
      fireEvent.click(getByText('+1'));
    });
    expect(store.getState()).toBe(1);
    expect(observer.next).toHaveBeenCalledWith(1);
    expect(getByTitle('count')).toHaveTextContent(/^1$/);
    await act(() => {
      fireEvent.click(getByText('throw'));
    });
    expect(observer.error.mock.calls[0][0].message).toBe('my error');
    unmount();
    expect(observer.complete).toHaveBeenCalled();
  });
  it('should allow passing 3 functions', async () => {
    const next = vitest.fn();
    const error = vitest.fn();
    const complete = vitest.fn();
    store.subscribe(next, error, complete);
    const { getByText, getByTitle, unmount } = render(<CountComponent />);
    await act(() => {
      fireEvent.click(getByText('+1'));
    });
    expect(store.getState()).toBe(1);
    expect(next).toHaveBeenCalledWith(1);
    expect(getByTitle('count')).toHaveTextContent(/^1$/);
    await act(() => {
      fireEvent.click(getByText('throw'));
    });
    expect(error.mock.calls[0][0].message).toBe('my error');
    unmount();
    expect(complete).toHaveBeenCalled();
  });
  it('should allow passing 2 functions', async () => {
    const next = vitest.fn();
    const error = vitest.fn();
    store.subscribe(next, error);
    const { getByText, getByTitle, unmount } = render(<CountComponent />);
    await act(() => {
      fireEvent.click(getByText('+1'));
    });
    expect(store.getState()).toBe(1);
    expect(next).toHaveBeenCalledWith(1);
    expect(getByTitle('count')).toHaveTextContent(/^1$/);
    await act(() => {
      fireEvent.click(getByText('throw'));
    });
    expect(error.mock.calls[0][0].message).toBe('my error');
    unmount();
  });
  it('should allow passing 1 function', async () => {
    const next = vitest.fn();
    store.subscribe(next);
    const { getByText, getByTitle, unmount } = render(<CountComponent />);
    await act(() => {
      fireEvent.click(getByText('+1'));
    });
    expect(store.getState()).toBe(1);
    expect(next).toHaveBeenCalledWith(1);
    expect(getByTitle('count')).toHaveTextContent(/^1$/);
    await act(() => {
      fireEvent.click(getByText('throw'));
    });
    unmount();
  });
  it('should allow unsubscribing', async () => {
    const next = vitest.fn();
    const sub = store.subscribe(next);
    sub.unsubscribe();
    const { getByText } = render(<CountComponent />);
    await act(() => {
      fireEvent.click(getByText('+1'));
    });
    expect(store.getState()).toBe(1);
    expect(next).not.toHaveBeenCalled();
  });
  it('should error when passing non-observer', async () => {
    const thrower = () => {
      store.subscribe(null);
    };
    expect(thrower).toThrowError();
  });
});
