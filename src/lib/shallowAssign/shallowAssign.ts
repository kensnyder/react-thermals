type Assignable =
  | Map<any, any>
  | Set<any>
  | Array<any>
  | Record<string, any>
  | Object;

/**
 * Create a copy of the given value, shallowly overriding properties
 * @param destination  The value to copy
 * @param source  Override values to extend the copy
 * @return  The composite value
 */
export default function shallowAssign<Sister extends Assignable>(
  destination: Sister,
  source: Partial<Sister>
): void {
  if (Array.isArray(destination) && Array.isArray(source)) {
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
