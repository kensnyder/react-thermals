import isFunction from '../isFunction/isFunction';

export default function isPromise(thing: any): thing is Promise<any> {
  return isFunction(thing?.then);
}
