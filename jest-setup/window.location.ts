// // Mock `window.location` with Jest spies and extend expect
// import 'jest-location-mock';
import { JSDOM } from 'jsdom';
const window = new JSDOM('').window;

const oldWindowLocation = window.location;

beforeEach(() => {
  window.location = Object.defineProperties(
    {},
    {
      ...Object.getOwnPropertyDescriptors(oldWindowLocation),
      assign: {
        configurable: true,
        value: vitest.fn(),
      },
      search: {
        configurable: true,
        writable: true,
        value: '',
      },
    }
  );
});
afterEach(() => {
  // restore `window.location` to the original `jsdom`
  // `Location` object
  window.location = oldWindowLocation;
});
