export default function isFunction(thing: any): thing is Function {
  return typeof thing === 'function';
}
