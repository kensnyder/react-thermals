module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    './jest-setup/window.location.js',
    './jest-setup/window.history.js',
  ],
};
