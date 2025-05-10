const path = require('path');

module.exports = {
  rootDir: '.',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleDirectories: ['node_modules', '<rootDir>'],
  moduleNameMapper: {
    // Handle module aliases (if configured in next.config.js)
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/public/',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'lib/utils/graph/graph-transform.ts',
    '!**/*.d.ts',
  ],
  // Temporarily disabled for initial testing
  // coverageThreshold: {
  //   global: {
  //     branches: 80,
  //     functions: 80,
  //     lines: 80,
  //     statements: 80,
  //   },
  // },
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/__tests__/test-utils.tsx',
  ],
  verbose: true,
};

