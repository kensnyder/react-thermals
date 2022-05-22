import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import createStore from '../../src/createStore/createStore.js';
import useStoreState from '../../src/useStoreState/useStoreState.js';
import undo from './undo.js';

describe('undo()', () => {
  // define store before each test
  let store, KeyboardComponent, KeyComponent;
  beforeEach(() => {
    const state = { keys: [], minutes: 60 };
    const actions = {
      pressKey: character => {
        store.mergeState(old => ({
          keys: [...old.keys, character],
        }));
      },
      addMinutes: num => {
        store.mergeState(old => ({ minutes: old.minutes + num }));
      },
    };
    store = createStore({
      state,
      actions,
    });
    KeyboardComponent = () => {
      const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
      const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
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
          <button onClick={store.undo}>undo</button>
          <button onClick={store.redo}>redo</button>
        </div>
      );
    };
    KeyComponent = ({ character }) => {
      const { pressKey } = store.actions;
      return <button onClick={() => pressKey(character)}>{character}</button>;
    };
  });
  it('should handle a undo, redo and branch', async () => {
    store.plugin(undo({ maxSize: 5 }));
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
  });
});
