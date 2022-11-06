import { vitest } from 'vitest';

export const MockLocation = {
  assign: vitest.fn(),
  search: '',
};

vitest.stubGlobal('location', MockLocation);
