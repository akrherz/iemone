export default {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less)$': '<rootDir>/test/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/test/__mocks__/fileMock.js',
    '^ol/(.*)$': '<rootDir>/test/__mocks__/ol.js',
    '^ol$': '<rootDir>/test/__mocks__/ol.js'
  },
  setupFilesAfterEnv: ['<rootDir>/test/setupTests.js'],
  testMatch: ['<rootDir>/test/**/*.test.js'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(ol|ol-mapbox-style|geotiff|quick-lru)/)'
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__mocks__/',
    '/test/'
  ],
  moduleFileExtensions: ['js', 'mjs']
};
