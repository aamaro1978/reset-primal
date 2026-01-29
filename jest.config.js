module.exports = {
  testEnvironment: 'node',
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    'api/**/*.js',
    '!api/node_modules/**',
    '!api/**/*.test.js',
    '!api/server.js' // Entry point, covered by integration tests
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  testTimeout: 10000,
  verbose: true,
  bail: false,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
