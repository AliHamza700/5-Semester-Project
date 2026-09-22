/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  globalSetup: './tests/global-setup.js',
  globalTeardown: './tests/global-teardown.js',
  verbose: true,
};
