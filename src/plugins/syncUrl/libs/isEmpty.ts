import { PlainObjectType } from '../../../types';

export default function isEmpty(obj: PlainObjectType): boolean {
  for (const key in obj) {
    /* istanbul ignore next @preserve */
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
}
