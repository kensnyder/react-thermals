export function parse(search: string) {
  const obj: Record<string, any> = {};
  for (const [key, value] of new URLSearchParams(search)) {
    obj[key] = value;
  }
  return obj;
}
export function stringify(obj: Record<string, any>) {
  const params = new URLSearchParams(obj);
  params.sort();
  return params.toString();
}
