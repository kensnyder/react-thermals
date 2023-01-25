import Store from '../../classes/Store/Store';
import PreventableEvent from '../../classes/PreventableEvent/PreventableEvent';

//
// Basic usage:
// store.plugin(undo({ maxSize: 50 }));
//
export default function undo({ maxSize = 100 } = {}) {
  return function plugin(store: Store) {
    let currIndex = 0;
    let isUpdating = false;
    const history: any[] = [];
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
    store.on('AfterUpdate', (evt: PreventableEvent) => {
      if (isUpdating) {
        isUpdating = false;
        return;
      }
      if (currIndex < history.length - 1) {
        // if we get a new state after an undo operation,
        // delete all the future stale states
        history.length = currIndex + 1;
      }
      history.push(evt.data.next);
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
      return store;
    }
    function redo() {
      if (currIndex < history.length) {
        jumpTo(currIndex + 1);
      }
      return store;
    }
    function jump(steps: number) {
      jumpTo(currIndex + steps);
      return store;
    }
    function jumpTo(toIndex: number) {
      if (toIndex < 0 || toIndex >= history.length) {
        const idx = Number(toIndex);
        throw new Error(
          `react-thermals: undo plugin - invalid history index ${idx}; history size is ${history.length}.`
        );
      }
      store.setState(history[toIndex]);
      isUpdating = true;
      currIndex = toIndex;
      return store;
    }
  };
}
