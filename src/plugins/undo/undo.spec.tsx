import React, {
  ComponentProps,
  FunctionComponent,
  MouseEventHandler,
} from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Store from '../../Store/Store';
import useStoreState from '../../useStoreState/useStoreState';
import undo from './undo';

describe('undo()', () => {
  // define store before each test
  let store: Store;
  let KeyboardComponent: FunctionComponent;
  let KeyComponent: FunctionComponent<{ character: string }>;
  beforeEach(() => {
    type MyState = {
      keys: string[];
      minutes: number;
    };
    const state: MyState = { keys: [], minutes: 60 };
    const actions = {
      pressKey: (character: string) => {
        store.mergeState((old: MyState) => ({
          keys: [...old.keys, character],
        }));
      },
      addMinutes: (num: number) => {
        store.mergeState((old: MyState) => ({ minutes: old.minutes + num }));
      },
    };
    store = new Store({
      state,
      actions,
    });
    KeyboardComponent = () => {
      const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
      const numbers = '0123456789'.split('');
      const state = useStoreState(store);
      const { addMinutes } = store.actions;
      return (
        <div className="Keyboard">
          <span title="output">output={state.keys.join('')}</span>
          {letters.map(letter => (
            <KeyComponent key={letter} character={letter} />
          ))}
          {numbers.map(number => (
            <KeyComponent key={number} character={number} />
          ))}
          <KeyComponent character=" " />
          <button onClick={() => addMinutes(5)}>+5 minutes</button>
          <button onClick={store.undo as MouseEventHandler}>undo</button>
          <button onClick={store.redo as MouseEventHandler}>redo</button>
          <button onClick={() => store.jumpTo(1)}>jumpTo(1)</button>
          <button onClick={() => store.jump(-2)}>jump(-2)</button>
        </div>
      );
    };
    KeyComponent = ({ character }) => {
      const { pressKey } = store.actions;
      return <button onClick={() => pressKey(character)}>{character}</button>;
    };
  });
  it('should handle a undo, redo and branch', async () => {
    store.plugin(undo());
    const { getByTitle, getByText } = render(<KeyboardComponent />);
    expect(getByTitle('output')).toHaveTextContent(/^output=$/);
    await act(() => {
      fireEvent.click(getByText('h'));
    });
    await act(() => {
      fireEvent.click(getByText('i'));
    });
    expect(getByTitle('output')).toHaveTextContent(/^output=hi$/);
    await act(() => {
      fireEvent.click(getByText('undo'));
    });
    expect(getByTitle('output')).toHaveTextContent(/^output=h$/);
    await act(() => {
      fireEvent.click(getByText('undo'));
    });
    expect(getByTitle('output')).toHaveTextContent(/^output=$/);
    await act(() => {
      fireEvent.click(getByText('redo'));
    });
    expect(getByTitle('output')).toHaveTextContent(/^output=h$/);
    await act(() => {
      fireEvent.click(getByText('e'));
      fireEvent.click(getByText('l'));
      fireEvent.click(getByText('l'));
      fireEvent.click(getByText('o'));
    });
    expect(getByTitle('output')).toHaveTextContent(/^output=hello$/);
    expect(store.getHistory()).toEqual([
      { keys: [], minutes: 60 },
      { keys: ['h'], minutes: 60 },
      { keys: ['h', 'e', 'l', 'l', 'o'], minutes: 60 },
    ]);
    await act(() => {
      fireEvent.click(getByText('jumpTo(1)'));
    });
    expect(getByTitle('output')).toHaveTextContent(/^output=h$/);
    expect(store.getHistory()).toEqual([
      { keys: [], minutes: 60 },
      { keys: ['h'], minutes: 60 },
      { keys: ['h', 'e', 'l', 'l', 'o'], minutes: 60 },
    ]);
    await act(() => {
      fireEvent.click(getByText('redo'));
    });
    await act(() => {
      fireEvent.click(getByText('jump(-2)'));
    });
    expect(getByTitle('output')).toHaveTextContent(/^output=$/);
    expect(store.getHistory()).toEqual([
      { keys: [], minutes: 60 },
      { keys: ['h'], minutes: 60 },
      { keys: ['h', 'e', 'l', 'l', 'o'], minutes: 60 },
    ]);
  });
  it('should respect maxSize option', async () => {
    store.plugin(undo({ maxSize: 2 }));
    const { getByTitle, getByText } = render(<KeyboardComponent />);
    expect(getByTitle('output')).toHaveTextContent(/^output=$/);
    await act(() => {
      fireEvent.click(getByText('h'));
    });
    await act(() => {
      fireEvent.click(getByText('i'));
    });
    await act(() => {
      fireEvent.click(getByText('p'));
    });
    expect(getByTitle('output')).toHaveTextContent(/^output=hip$/);
    expect(store.getHistory()).toEqual([
      { keys: ['h', 'i'], minutes: 60 },
      { keys: ['h', 'i', 'p'], minutes: 60 },
    ]);
  });
  it('should throw error if jumping to a bad index', async () => {
    store.plugin(undo());
    const thrower = () => {
      store.jumpTo(2);
    };
    expect(thrower).toThrowError();
  });
});
