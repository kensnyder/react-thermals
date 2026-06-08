export default function isArray<T>(thing: any): thing is T[] {
  return Array.isArray(thing);
}
