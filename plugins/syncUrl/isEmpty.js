export default function isEmpty(obj) {
  for (const key in obj) {
    if (Object.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
}
