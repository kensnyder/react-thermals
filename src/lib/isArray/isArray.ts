export default function isArray<T>(thing: T[]): thing is Array<T> {
  return Array.isArray(thing);
}
