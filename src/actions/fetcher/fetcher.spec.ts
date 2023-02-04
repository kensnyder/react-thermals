import { fetcher, jsonFetcher } from './fetcher';

describe('fetcher()', () => {
  it('should be a function', () => {
    expect(fetcher).toBeInstanceOf(Function);
  });
});
describe('jsonFetcher()', () => {
  it('should be a function', () => {
    expect(jsonFetcher).toBeInstanceOf(Function);
  });
});
