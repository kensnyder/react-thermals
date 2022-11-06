import { vitest } from 'vitest';

/* istanbul ignore next */
export const MockHistory = {
  pushState: vitest.fn((data: any, title: string, url: string) => {
    location.search = url;
  }),
  replaceState: vitest.fn((data: any, title: string, url: string) => {
    location.search = url;
  }),
};

vitest.stubGlobal('history', MockHistory);
