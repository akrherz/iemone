export default {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less)$': '<rootDir>/tests/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/tests/__mocks__/fileMock.js',
    '^ol/(.*)$': '<rootDir>/tests/__mocks__/ol.js',
    '^ol$': '<rootDir>/tests/__mocks__/ol.js',
    '^iemjs/iemdata$': '<rootDir>/node_modules/iemjs/src/iemdata.js',
    '^iemjs/domUtils$': '<rootDir>/node_modules/iemjs/src/domUtils.js'

  },
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  transform: {
    '^.+\\.js$': ['babel-jest', { rootMode: "upward" }]
  },

  transformIgnorePatterns: [
    'node_modules/(?!(ol|ol-mapbox-style|geotiff|quick-lru|iemjs)/).*'
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__mocks__/',
    '/tests/'
  ],
  moduleFileExtensions: ['js', 'mjs']
};
