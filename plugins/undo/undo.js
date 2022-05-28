//
// TO USE:
// store.plugin(undo({ maxSize: 100 }));
//
export default function undo({ maxSize = 100 } = {}) {
  return function plugin(store) {
    let currIndex = 0;
    let isUpdating = false;
    const history = [];
    store.undo = undo;
    store.redo = redo;
    store.jump = jump;
    store.jumpTo = jumpTo;
    store.getHistory = () => history;
    store.on('AfterFirstMount', () => {
      history.push(store.getState());
    });
    store.on('AfterLastUnmount', () => {
      history.length = 0;
      currIndex = 0;
    });
    store.on('AfterUpdate', ({ data: { next } }) => {
      if (isUpdating) {
        isUpdating = false;
        return;
      }
      if (currIndex < history.length - 1) {
        // if we get a new state after an undo, delete all
        // the future stale states
        history.length = currIndex + 1;
      }
      history.push(next);
      if (history.length > maxSize) {
        history.shift();
      } else {
        currIndex++;
      }
    });
    function undo() {
      if (currIndex > 0) {
        jumpTo(currIndex - 1);
      }
    }
    function redo() {
      if (currIndex < history.length) {
        jumpTo(currIndex + 1);
      }
    }
    function jump(steps) {
      jumpTo(currIndex + steps);
    }
    function jumpTo(toIndex) {
      if (toIndex < 0 || toIndex >= history.length) {
        const idx = Number(toIndex);
        throw new Error(
          `react-thermals: undo plugin - invalid history index ${idx}; history size is ${history.length}.`
        );
      }
      store.setState(history[toIndex]);
      isUpdating = true;
      currIndex = toIndex;
    }
  };
}
