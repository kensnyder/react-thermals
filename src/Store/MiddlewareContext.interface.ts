import Store from './Store';

export default interface MiddlewareContextInterface {
  prev: any;
  next: any;
  isAsync: boolean;
  store: Store;
}
