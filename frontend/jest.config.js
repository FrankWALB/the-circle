module.exports = {
  testEnvironment: 'jsdom',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      diagnostics: false,
    }],
  },
  moduleNameMapper: {
    // Specific mocks must come before the catch-all
    '^@angular/core$':        '<rootDir>/__mocks__/angular-core.js',
    '^@angular/common/http$': '<rootDir>/__mocks__/angular-common-http.js',
    '^@angular/(.*)$':        '<rootDir>/__mocks__/angular-generic.js',
    '^uuid$':                 '<rootDir>/__mocks__/uuid.js',
  },
};
