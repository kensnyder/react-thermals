export function composeActions(actions) {
  return function actionCombiner(...args) {
    actions.forEach(action => action(...args));
  };
}

export function pipeActions(actions) {
  return function actionPiper(...args) {
    const store = this;
    actions.forEach(action => {
      action(...args);
      store.flushSync();
    });
  };
}
