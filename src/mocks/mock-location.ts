import { vitest } from 'vitest';

/* istanbul ignore next @preserve */
export const MockLocation = {
  assign: vitest.fn(),
  search: '',
};

vitest.stubGlobal('location', MockLocation);
