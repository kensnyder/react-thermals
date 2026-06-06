import { mock } from 'bun:test';

/* istanbul ignore next @preserve */
export const MockLocation = {
  assign: mock(),
  search: '',
};

globalThis.location = MockLocation as unknown as Location;
