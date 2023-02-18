import replacePath from './replacePath';

describe('replacePath()', () => {
  it('should throw if path is not a string', () => {
    const thrower = () => {
      const oldObj = { hello: 'world' };
      // @ts-ignore
      const newObj = replacePath(oldObj, 8, 'people');
    };
    expect(thrower).toThrow(Error);
  });
  it('should throw if path is empty', () => {
    const thrower = () => {
      const oldObj = { hello: 'world' };
      const newObj = replacePath(oldObj, '', 'people');
    };
    expect(thrower).toThrow(Error);
  });
  it('should handle simple path', () => {
    const oldObj = { hello: 'world' };
    const newObj = replacePath(oldObj, 'hello', 'people');
    expect(newObj).toEqual({ hello: 'people' });
  });
  it('should create non-existent path', () => {
    const oldObj = {};
    const newObj = replacePath(oldObj, 'hello', 'people');
    expect(newObj).toEqual({ hello: 'people' });
  });
  it('should create non-existent 2-segment path', () => {
    const oldObj = {};
    const newObj = replacePath(oldObj, 'hello.users', 'greetings');
    expect(newObj).toEqual({ hello: { users: 'greetings' } });
  });
  it('should handle path with star', () => {
    const oldObj = { primes: [2, 3, 5, 7] };
    const newObj = replacePath(oldObj, 'primes.*', (p: number) => p * p);
    expect(newObj).toEqual({ primes: [4, 9, 25, 49] });
  });
  it('should create non-existent path with star', () => {
    const oldObj = {};
    const newObj = replacePath(oldObj, 'hello.*', 'people');
    expect(newObj).toEqual({ hello: [] });
  });
});
