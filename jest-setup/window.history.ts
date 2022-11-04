const oldWindowHistory = window.history;

beforeEach(() => {
  delete window.history;

  window.history = Object.defineProperties(
    {},
    {
      ...Object.getOwnPropertyDescriptors(oldWindowHistory),
      replaceState: {
        configurable: true,
        value: jest.fn(),
      },
      pushState: {
        configurable: true,
        value: jest.fn(),
      },
    }
  );
});
afterEach(() => {
  // restore `window.location` to the original `jsdom`
  // `Location` object
  window.history = oldWindowHistory;
});
