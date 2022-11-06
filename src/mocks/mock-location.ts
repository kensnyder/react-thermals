import { vitest } from 'vitest';

/* istanbul ignore next */
export const MockLocation = {
  assign: vitest.fn(),
  search: '',
};

vitest.stubGlobal('location', MockLocation);
