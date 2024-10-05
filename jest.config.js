module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '**.js'],
  moduleDirectories: ['node_modules', './src'],

  // disable type checks on tests
  transform: {
    "^.+\\.spec.ts?$": [
      "ts-jest",
      {
        diagnostics: false,
      },
    ],
  },
};
