export default function isEmpty(obj) {
  for (const key in obj) {
    /* istanbul ignore next */
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
}
