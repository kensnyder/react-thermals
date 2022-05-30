export function tryParse(parse, json) {
  try {
    return parse(json);
  } catch (error) {
    console.error('react-thermals: persistState plugin parse error: ', error);
    return undefined;
  }
}
export function tryStringify(stringify, value) {
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
