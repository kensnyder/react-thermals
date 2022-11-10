import { PlainObjectType } from '../../../types';

export function omitUnknown(fields: string[], obj: PlainObjectType) {
  const known: PlainObjectType = {};
  for (const [key, value] of Object.entries(obj)) {
    if (fields.includes(key)) {
      known[key] = value;
    }
  }
  return known;
}

export function omitKnown(fields: string[], obj: PlainObjectType) {
  const unknown: PlainObjectType = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!fields.includes(key)) {
      unknown[key] = value;
    }
  }
  return unknown;
}
