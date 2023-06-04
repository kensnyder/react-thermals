/**
 * Helper function to create a setState function that adds the given amount
 * @param baseAmount  A base amount to add
 *   e.g. use baseAmount = 1 to create an incrementer function and baseAmount = -1 for a decremeter function
 * @return  A function suitable for store.connect(path, fn)
 * @example
 * const store = new Store({ score: 0, highScore: 1000 });
 * const maybeUpdateHighScore = newScore => {
 *   if (newScore > store.getStateAt('highScore')) {
 *     store.setStateAt('highScore', newScore);
 *   }
 * };
 * const eatEnemy = store.connect('score', adder(10), maybeUpdateHighScore);
 *
 * const levelUp = store.connect('score', adder(100), newScore => {
 *   maybeUpdateHighScore(newScore);
 *   window.postMessage({ type: 'LEVEL_UP', data: newScore });
 * });
 */
export default function adder(baseAmount = 0) {
  return function updater(amount = 0) {
    return (old: number) => old + baseAmount + amount;
  };
}
