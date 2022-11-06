import Store from '../Store/Store';

export function composeActions(actions: Function[]) {
  return function actionCombiner(...args: any[]) {
    actions.forEach(action => action(...args));
  };
}

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
