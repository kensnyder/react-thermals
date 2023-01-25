import Store from '../../classes/Store/Store';

/**
 * Given a list of actions, run them all, i.e. parallel
 * @param actions
 * @return  A function to run the actions
 */
export function composeActions(actions: Function[]) {
  return function actionCombiner(...args: any[]) {
    actions.forEach(action => action(...args));
  };
}

/**
 * Given a list of actions, pipe results of action to the next action, i.e. in series
 * @param actions
 * @return  A function to run the actions
 */
export function pipeActions(actions: Function[]) {
  return async function actionPiper(this: Store, ...args: any[]) {
    const store = this;
    for (const action of actions) {
      let result = action(...args);
      if (typeof result?.then === 'function') {
        result = await result;
      }
      store.flushSync();
    }
  };
}
