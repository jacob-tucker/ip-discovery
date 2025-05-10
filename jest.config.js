const nextJest = require('next/jest');

// Providing the path to your Next.js app which will enable loading next.config.js and .env files
const createJestConfig = nextJest({
  dir: './',
});

// Any custom Jest config
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    // Handle module aliases (if configured in next.config.js)
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'components/IPGraph/**/*.{ts,tsx}',
    'lib/utils/graph/**/*.{ts,tsx}',
    'lib/hooks/useDerivativeData.ts',
    'lib/hooks/useGraphFilters.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  // Exclude some of the files from the test coverage
  coveragePathIgnorePatterns: [
    // Next.js auto generated files
    '[/\\\\].next[/\\\\]',
    '[/\\\\]node_modules[/\\\\]',
    '[/\\\\]__tests__[/\\\\]test-utils.tsx',
  ],
  // Directories that Jest should use to search for test files
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/public/',
  ],
  transform: {
    // Next.js uses babel-jest to transform code
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  // Transform files with other extensions (e.g. CSS, SVG)
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx|js|jsx)'],
  verbose: true,
};

// createJestConfig is exported in this way to ensure that next/jest can load
// the Next.js configuration, which is async
module.exports = createJestConfig(customJestConfig);