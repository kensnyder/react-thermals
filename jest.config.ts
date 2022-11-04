module.exports = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  transformIgnorePatterns: ['./node_modules/'],
  testEnvironment: 'jsdom',
  // setupFilesAfterEnv: [
  //   './jest-setup/window.location.ts',
  //   './jest-setup/window.history.ts',
  // ],
  globals: {
    'ts-jest': {
      tsconfig: {
        rootDir: '.',
      },
    },
  },
};
