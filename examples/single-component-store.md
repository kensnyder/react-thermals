# Example: A store used by one component

Even if a store is only used by one component, it can be a nice way to separate
concerns. And the store object itself doesn't necessarily need to be exported.
You might want your application to interact with the store only through hooks
and functions exported by your store file.

In components/Game/gameStore.ts

```ts
import { Store, useStoreState } from 'react-thermals';
import random from 'random-int';

const store = new Store({
  board: {
    user: { x: 0, y: 0 },
    flag: { x: random(1, 10), y: random(1, 10) },
  },
  hasWon: false,
});

export function restart() {
  store.reset();
  store.setStateAt('board.flag', {
    x: random(1, 10),
    y: random(1, 10),
  });
}

export function moveBy(x: number, y: number): void {
  store.setStateAt('board.user', old => ({
    x: old.x + x,
    y: old.y + y,
  }));
  const { user, flag } = store.getStateAt('board');
  if (flag.x === user.x && flag.y === user.y) {
    store.mergeState({ hasWon: true });
  }
}

export function useGameState() {
  return useStoreState(store);
}
```

In components/Game/Game.tsx

```tsx
import React from 'react';
import range from '../range';
import './Game.css';
import { useGameState, restart, moveBy } from './gameStore';

export default function Game(): React.Element {
  const state = useGameState();

  return (
    <div className="Game">
      <h1>Hop to the flag</h1>
      <div className="board">
        {range(11).map((x: number) => (
          <div key={`x-${x}`} className="row">
            {range(11).map((y: number) => (
              <div key={`y-${y}`} className="cell">
                {state.board.user.x === x && state.board.user.y === y
                  ? '🐸'
                  : state.board.flag.x === x &&
                    state.board.flag.y === y &&
                    '⛳️'}
              </div>
            ))}
          </div>
        ))}
      </div>
      {state.hasWon ? (
        <div className="you-win">
          You win!
          <button onClick={restart}>New game</button>
        </div>
      ) : (
        <div className="controls">
          <button onClick={() => moveBy(0, -1)}>←</button>
          <button onClick={() => moveBy(-1, 0)}>↑</button>
          <button onClick={() => moveBy(1, 0)}>↓</button>
          <button onClick={() => moveBy(0, 1)}>→</button>
        </div>
      )}
    </div>
  );
}
```
