import type { PlainObjectType } from '../../../types';
import dateParser from 'any-date-parser';

export type SchemaType =
  | 'string'
  | 'string[]'
  | 'number'
  | 'number[]'
  | 'Date'
  | 'Date[]'
  | 'boolean'
  | 'boolean[]';

export type CastableSchema = Record<string, SchemaType>;

export function castToStrings(schema: CastableSchema, obj: PlainObjectType) {
  const casted: Record<string, keyof PlainObjectType> = {};
  for (const [key, value] of Object.entries(obj)) {
    casted[key] = _castToString(schema, key, value);
  }
  return casted;
}
export function castFromStrings(schema: CastableSchema, obj: PlainObjectType) {
  const casted: Record<string, keyof PlainObjectType> = {};
  for (const [key, value] of Object.entries(obj)) {
    casted[key] = _castFromString(schema, key, value);
  }
  return casted;
}
function _castToString(schema: CastableSchema, field: string, value: any) {
  const toType = schema[field];
  if (!toType) {
    return value;
  }
  /* istanbul ignore next @preserve */
  switch (toType.toLowerCase()) {
    case 'string':
    case 'string[]':
    case 'number':
    case 'number[]':
      return String(value);
    case 'date':
      // @ts-ignore
      const date = dateParser.fromString(value);
      return new Intl.DateTimeFormat().format(date);
    case 'date[]':
      return value.map((v: number | Date | undefined) => {
        // @ts-ignore
        const date = dateParser.fromString(v);
        return new Intl.DateTimeFormat().format(date);
      });
    case 'boolean':
      return value ? 'true' : 'false';
    case 'boolean[]':
      return value.map((v: any) => (v ? 'true' : 'false'));
    default:
      throw new Error(`react-thermals: unknown schema type "${toType}"`);
  }
}
function _castFromString(schema: CastableSchema, field: string, value: any) {
  const toType: SchemaType = schema[field];
  /* istanbul ignore next @preserve */
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
      return value.split(',').map((v: string) => new Date(Date.parse(v)));
    case 'boolean':
      return value === 'true';
    case 'boolean[]':
      return value.split(',').map((v: string) => v === 'true');
    default:
      throw new Error(`react-thermals: unknown schema type "${toType}"`);
  }
}
