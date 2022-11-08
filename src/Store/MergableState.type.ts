export type MergableStateType = Object | ((newState: Object) => Object);

export type MergableStateAsyncType = MergableStateType | Promise<Object>;