import { mock } from 'bun:test';

/* istanbul ignore next @preserve */
export const MockHistory = {
  pushState: mock((data: any, title: string, url: string) => {
    location.search = url;
  }),
  replaceState: mock((data: any, title: string, url: string) => {
    location.search = url;
  }),
};

Object.defineProperty(globalThis, 'history', {
  value: MockHistory,
  writable: true,
  configurable: true,
});
