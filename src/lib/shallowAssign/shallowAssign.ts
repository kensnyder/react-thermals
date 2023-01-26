type Assignable =
  | Map<any, any>
  | Set<any>
  | Array<any>
  | Record<any, any>
  | Object;

/**
 * Create a copy of the given value, shallowly overriding properties
 * @param destination  The value to copy
 * @param source  Override values to extend the copy
 * @return  The composite value
 */
export default function shallowAssign(
  destination: Assignable,
  source: Assignable
): void {
  if (destination instanceof Map && source instanceof Map) {
    for (const [key, val] of source.entries()) {
      destination.set(key, val);
    }
  } else if (destination instanceof Set && source instanceof Set) {
    for (const item of source) {
      destination.add(item);
    }
  } else if (Array.isArray(destination) && Array.isArray(source)) {
    for (let i = 0, len = source.length; i < len; i++) {
      destination[i] = source[i];
    }
  } else if (
    destination &&
    typeof destination === 'object' &&
    source &&
    typeof source === 'object'
  ) {
    Object.assign(destination, source);
  } else {
    // not assignable!
  }
}
