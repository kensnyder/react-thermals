export function omitUnknown(fields: string[], obj: Object) {
  const known: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (fields.includes(key)) {
      known[key] = value;
    }
  }
  return known;
}

export function omitKnown(fields: string[], obj: Object) {
  const unknown: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!fields.includes(key)) {
      unknown[key] = value;
    }
  }
  return unknown;
}
