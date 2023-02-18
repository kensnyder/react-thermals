import { vitest } from 'vitest';
import {
  composeActions,
  pipeActions,
  pipeActionsAsync,
} from './composeActions';

describe('composeActions', () => {
  it('should run in series', () => {
    const spies = [vitest.fn(n => n * 3), vitest.fn(n => n * 5)];
    const result = composeActions(spies)(7);
    expect(result).toEqual([21, 35]);
    expect(spies[0]).toHaveBeenCalledWith(7);
    expect(spies[1]).toHaveBeenCalledWith(7);
  });
});
describe('pipeActions', () => {
  it('should run in parallel', () => {
    const spies = [vitest.fn(n => n * 3), vitest.fn(n => n * 5)];
    const result = pipeActions(spies)(7);
    expect(result).toBe(105);
    expect(spies[0]).toHaveBeenCalledWith(7);
    expect(spies[1]).toHaveBeenCalledWith(21);
  });
});
describe('pipeActionsAsync', () => {
  it('should run in parallel, resolving all', async () => {
    const spies = [
      vitest.fn(n => Promise.resolve(n * 3)),
      vitest.fn(n => Promise.resolve(n * 5)),
    ];
    const result = await pipeActionsAsync(spies)(7);
    expect(result).toBe(105);
    expect(spies[0]).toHaveBeenCalledWith(7);
    expect(spies[1]).toHaveBeenCalledWith(21);
  });
  it('should run in parallel, resolving some', async () => {
    const spies = [
      vitest.fn(n => Promise.resolve(n * 3)),
      vitest.fn(n => n * 5),
    ];
    const result = await pipeActionsAsync(spies)(7);
    expect(result).toBe(105);
    expect(spies[0]).toHaveBeenCalledWith(7);
    expect(spies[1]).toHaveBeenCalledWith(21);
  });
});
