import Store from '../../classes/Store/Store';
import isPromise from '../../lib/isPromise/isPromise';

/**
 * Given a list of actions, run them all, i.e. parallel
 * @param actions  The array of action functions to run in parallel
 * @return  A function to run the actions
 */
export function composeActions(actions: Function[]) {
  return function actionCombiner(...args: any[]) {
    actions.forEach(action => action(...args));
  };
}

/**
 * Given a list of actions, pipe results of action to the next action, i.e. in series
 * @param actions  The array of action functions to pipe together
 * @return  A function to run the actions
 */
export function pipeActions(actions: Function[]) {
  return async function actionPiper(this: Store, ...args: any[]) {
    for (const action of actions) {
      let result = action(...args);
      if (isPromise(result)) {
        result = await result;
      }
    }
  };
}
