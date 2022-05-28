export function castToStrings(schema, obj) {
  if (!schema) {
    return obj;
  }
  const casted = {};
  for (const [key, value] of Object.entries(obj)) {
    casted[key] = _castToString(schema, key, value);
  }
  return casted;
}
export function castFromStrings(schema, obj) {
  if (!schema) {
    return obj;
  }
  const casted = {};
  for (const [key, value] of Object.entries(obj)) {
    casted[key] = _castFromString(schema, key, value);
  }
  return casted;
}
function _castToString(schema, field, value) {
  const toType = schema[field];
  if (!toType) {
    return value;
  }
  switch (toType.toLowerCase()) {
    case 'string':
    case 'string[]':
    case 'number':
    case 'number[]':
      return String(value);
    case 'date':
      return new Intl.DateTimeFormat().format(value);
    case 'date[]':
      return value.map(v => new Intl.DateTimeFormat().format(v));
    case 'boolean':
      return value ? 'true' : 'false';
    case 'boolean[]':
      return value.map(v => (v ? 'true' : 'false'));
    default:
      /* istanbul ignore next */
      throw new Error(`react-thermals: unknown schema type "${toType}"`);
  }
}
function _castFromString(schema, field, value) {
  const toType = schema[field];
  /* istanbul ignore next */
  if (!toType) {
    return value;
  }
  switch (toType.toLowerCase()) {
    case 'string':
      return value;
    case 'string[]':
      return value.split(',');
    case 'number':
      return parseFloat(value);
    case 'number[]':
      return value.split(',').map(parseFloat);
    case 'date':
      return new Date(Date.parse(value));
    case 'date[]':
      return value.split(',').map(v => new Date(Date.parse(v)));
    case 'boolean':
      return value === 'true';
    case 'boolean[]':
      return value.split(',').map(v => v === 'true');
    default:
      throw new Error(`react-thermals: unknown schema type "${toType}"`);
  }
}
