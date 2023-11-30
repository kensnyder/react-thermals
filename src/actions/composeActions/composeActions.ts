import isPromise from '../../lib/isPromise/isPromise';

/**
 * Given a list of actions, run them all, i.e. parallel
 * @param actions  The array of action functions to run in parallel
 * @return  A function to run the actions, returning the result of the first action that returns a value
 */
export function composeActions(actions: Function[]) {
  return function actionCombiner(...args: any[]) {
    let firstResult: any;
    for (const action of actions) {
      const result = action(...args);
      if (firstResult === undefined) {
        firstResult = result;
      }
    }
    return firstResult;
  };
}

/**
 * Given a list of actions, pipe results of action to the next action, i.e. in series
 * @param actions  The array of action functions to pipe together
 * @return  A function to run the actions
 */
export function pipeActions(actions: Function[]) {
  return function actionPiper(result: any): any {
    for (const action of actions) {
      result = action(result);
    }
    return result;
  };
}

/**
 * Given a list of actions, pipe results of action to the next action, i.e. in series
 * @param actions  The array of action functions to pipe together
 * @return  A function to run the actions
 */
export function pipeActionsAsync(actions: Function[]) {
  return async function actionPiper(result: any): Promise<any> {
    for (const action of actions) {
      result = action(result);
      if (isPromise(result)) {
        result = await result;
      }
    }
    return result;
  };
}
