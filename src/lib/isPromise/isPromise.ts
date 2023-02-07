import isFunction from '../isFunction/isFunction';

export default function isPromise(thing: any): boolean {
  return isFunction(thing?.then);
}
