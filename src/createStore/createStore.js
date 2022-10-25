import Store from '../Store/Store.js';

export default function createStore(specs = {}) {
  return new Store(specs);
}
