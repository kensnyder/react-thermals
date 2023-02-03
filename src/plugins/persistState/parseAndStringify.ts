export type ParseType = (serialized: string) => any;
export type StringifyType = (value: any) => string;

export function tryParse(parse: ParseType, serialized: string): any {
  try {
    return parse(serialized);
  } catch (error) {
    console.error('react-thermals: persistState plugin parse error: ', error);
    return undefined;
  }
}
export function tryStringify(stringify: StringifyType, value: any): string {
  try {
    return stringify(value);
  } catch (error) {
    console.error(
      'react-thermals: persistState plugin stringify error: ',
      error
    );
    return '';
  }
}
