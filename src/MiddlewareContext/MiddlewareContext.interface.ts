import Store from '../Store/Store';

export default interface MiddlewareContext {
  prev: any;
  next: any;
  isAsync: boolean;
  store: Store;
}
