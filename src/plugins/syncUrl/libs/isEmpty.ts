export default function isEmpty(obj: Object) {
  for (const key in obj) {
    /* istanbul ignore next @preserve */
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
}
