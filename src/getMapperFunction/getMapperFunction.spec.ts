import getMapperFunction from './getMapperFunction';

describe('getMapperFunction(function|string|int|array)', () => {
  it('should pass through functions', () => {
    const fn = state => state.count;
    const mapper = getMapperFunction(fn);
    expect(mapper).toBe(fn);
  });
  it('should accept strings', () => {
    const mapper = getMapperFunction('phone');
    const slice = mapper({ name: 'John', phone: '867-5309' });
    expect(slice).toEqual('867-5309');
  });
  it('should accept integers', () => {
    const mapper = getMapperFunction(1);
    const slice = mapper(['red', 'blue', 'green']);
    expect(slice).toEqual('blue');
  });
  it('should accept arrays', () => {
    const mapper = getMapperFunction(['name', 'phone']);
    const slice = mapper({ name: 'John', phone: '867-5309' });
    expect(slice).toEqual(['John', '867-5309']);
  });
  it('should return an identity function on null', () => {
    const mapper = getMapperFunction(null);
    const slice = mapper(5);
    expect(slice).toBe(5);
  });
  it('should return an identity function on undefined', () => {
    const mapper = getMapperFunction(undefined);
    const slice = mapper({ hello: 'world' });
    expect(slice).toEqual({ hello: 'world' });
  });
  it('should throw errors on boolean', () => {
    const tryIt = () => {
      getMapperFunction(false);
    };
    expect(tryIt).toThrowError();
  });
  it('should accept mixed arrays', () => {
    const mapper = getMapperFunction(['name', state => state.phone]);
    const slice = mapper({ name: 'John', phone: '867-5309' });
    expect(slice).toEqual(['John', '867-5309']);
  });
  it('should accept nested arrays', () => {
    const mapper = getMapperFunction([['name', [state => state.phone]]]);
    const slice = mapper({ name: 'John', phone: '867-5309' });
    expect(slice).toEqual([['John', ['867-5309']]]);
  });
});
describe('getMapperFunction(pathedString)', () => {
  it('should accept strings with dots', () => {
    const mapper = getMapperFunction('user.phone');
    const slice = mapper({ user: { phone: '867-5309' } });
    expect(slice).toEqual('867-5309');
  });
  it('should return undefined for non-existent paths', () => {
    const mapper = getMapperFunction('user.phone');
    const slice = mapper({});
    expect(slice).toEqual(undefined);
  });
  it('should accept array strings with dots', () => {
    const mapper = getMapperFunction(['user.phone', 'cart.total']);
    const slice = mapper({
      user: { phone: '867-5309' },
      cart: { total: 42 },
    });
    expect(slice).toEqual(['867-5309', 42]);
  });
});
