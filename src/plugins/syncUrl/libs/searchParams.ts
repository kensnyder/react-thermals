import type { PlainObjectType } from '../../../types';

export function parse(search: string) {
  const obj: PlainObjectType = {};
  for (const [key, value] of new URLSearchParams(search)) {
    obj[key] = value;
  }
  return obj;
}
export function stringify(obj: PlainObjectType) {
  const params = new URLSearchParams(obj);
  params.sort();
  return params.toString();
}
