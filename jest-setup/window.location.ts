// // Mock `window.location` with Jest spies and extend expect
// import 'jest-location-mock';

const oldWindowLocation = window.location;

beforeEach(() => {
  delete window.location;

  window.location = Object.defineProperties(
    {},
    {
      ...Object.getOwnPropertyDescriptors(oldWindowLocation),
      assign: {
        configurable: true,
        value: jest.fn(),
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
