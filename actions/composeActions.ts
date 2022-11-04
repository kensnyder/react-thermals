export function composeActions(actions) {
  return function actionCombiner(...args) {
    actions.forEach(action => action(...args));
  };
}

export function pipeActions(actions) {
  return async function actionPiper(...args) {
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
