/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/__tests__/**'],
  // expo/src/winter installs WinterCG globals via lazy getters that call require()
  // when accessed. Jest 30's throwIfBetweenTests guard blocks those require() calls
  // during module setup. Since Node.js 25 already has all WinterCG globals natively
  // (TextDecoder, URL, URLSearchParams, DOMException, structuredClone, fetch, FormData),
  // we skip the expo winter polyfill entirely.
  moduleNameMapper: {
    '^expo/src/winter$': '<rootDir>/__mocks__/expo-winter.js',
    '^@expo/vector-icons$': '<rootDir>/__mocks__/@expo/vector-icons.js',
  },
};
