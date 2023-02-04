import { composeActions, pipeActions } from './composeActions';

describe('composeActions', () => {
  it('should be a function', () => {
    expect(composeActions).toBeInstanceOf(Function);
  });
});
describe('pipeActions', () => {
  it('should be a function', () => {
    expect(pipeActions).toBeInstanceOf(Function);
  });
});
