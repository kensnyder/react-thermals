import { act, fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { FunctionComponent, MouseEvent, MouseEventHandler } from 'react';
import Store from '../../classes/Store/Store';
import useStoreState from '../../hooks/useStoreState/useStoreState';
import observable from './observable';

describe('observable()', () => {
  let store: Store;
  let CountComponent: FunctionComponent;
  let increment: MouseEventHandler;
  let thrower: { (): void; (event: MouseEvent<Element, MouseEvent>): void };
  beforeEach(() => {
    store = new Store(0);
    increment = () => {
      store.setState((old: number) => old + 1);
    };
    thrower = () => {
      store.setState(() => Promise.reject('my error'));
    };
    store.plugin(observable());
    CountComponent = () => {
      const state = useStoreState(store);
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
    const observer = { next: mock() };
    store.subscribe(observer);
    // @ts-ignore Event is irrelevant
    increment({});
    await store.nextState();
    expect(store.getState()).toBe(1);
    expect(observer.next).toHaveBeenCalledWith(1);
  });
  it('should fire on user actions', async () => {
    const observer = {
      next: mock(),
      complete: mock(),
      error: mock(),
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
    expect(observer.error.mock.calls[0][0]).toBe('my error');
    unmount();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(observer.complete).toHaveBeenCalled();
  });
  it('should allow passing 3 functions', async () => {
    const next = mock();
    const error = mock();
    const complete = mock();
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
    expect(error.mock.calls[0][0]).toBe('my error');
    unmount();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(complete).toHaveBeenCalled();
  });
  it('should allow passing 2 functions', async () => {
    const next = mock();
    const error = mock();
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
    expect(error.mock.calls[0][0]).toBe('my error');
    unmount();
  });
  it('should allow passing 1 function', async () => {
    const next = mock();
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
    const next = mock();
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
