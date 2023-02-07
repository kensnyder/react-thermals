import { OverrideableType } from '../../types';
import isArray from '../isArray/isArray';

/**
 * Create a copy of the given value, shallowly overriding properties
 * @param value  The value to copy
 * @param overrides  Override values to extend the copy
 * @return  The composite value
 */
export default function shallowOverride<Shape>(
  value: OverrideableType<Shape>,
  overrides: OverrideableType<Shape>
): OverrideableType<Shape> {
  if (isArray(value)) {
    if (isArray(overrides)) {
      return [...(value as Iterable<Shape>), ...(overrides as Iterable<Shape>)];
    } else {
      return [...(value as Iterable<Shape>)];
    }
  } else if (value && typeof value === 'object') {
    const copy = { ...value };
    if (overrides && typeof overrides === 'object') {
      Object.assign(copy, overrides);
    }
    return copy;
  } else {
    return overrides === undefined ? value : overrides;
  }
}
