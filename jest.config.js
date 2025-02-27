module.exports = {
  preset: 'jest-preset-angular',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$)',
  ],
  moduleNameMapper: {
    'worker-loader!.*': '<rootDir>/test/mocks/workerMock.js',
    'pdfjs-dist/build/pdf.worker': '<rootDir>/test/mocks/workerMock.js',
    "^src/environments/environment$": "<rootDir>/src/environments/environment.ts",
    "uuid": require.resolve('uuid'),
  },
  coverageReporters: ["clover", "json", "lcov", "text", "text-summary"],
  collectCoverage: true,
  testResultsProcessor: "jest-sonar-reporter",
  setupFiles: ['zone.js']
}