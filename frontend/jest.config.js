module.exports = {
  testEnvironment: 'jsdom',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    '^@angular/core$': '<rootDir>/__mocks__/angular-core.js',
    '^@angular/common/http$': '<rootDir>/__mocks__/angular-common-http.js',
  },
};
