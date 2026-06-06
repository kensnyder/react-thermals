import type { TestingLibraryMatchers } from '@testing-library/jest-dom/types/matchers';

declare module 'bun:test' {
  interface Matchers<T = any> extends TestingLibraryMatchers<string, T> {}
}
