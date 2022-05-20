export function parse(search) {
  const obj = {};
  for (const [key, value] of new URLSearchParams(search)) {
    obj[key] = value;
  }
  return obj;
}
export function stringify(obj) {
  const params = new URLSearchParams(obj);
  params.sort();
  return params.toString();
}
