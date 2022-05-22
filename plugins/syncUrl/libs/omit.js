export function omitUnknown(fields, obj) {
  const known = {};
  for (const [key, value] of Object.entries(obj)) {
    if (fields.includes(key)) {
      known[key] = value;
    }
  }
  return known;
}

export function omitKnown(fields, obj) {
  const unknown = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!fields.includes(key)) {
      unknown[key] = value;
    }
  }
  return unknown;
}
