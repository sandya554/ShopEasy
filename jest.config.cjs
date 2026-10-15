// Jest configuration (unit + component tests)
module.exports = {
  testEnvironment: "jsdom", // a fake browser so React components can render
  setupFilesAfterEnv: ["<rootDir>/src/test/setupTests.js"],
  testMatch: ["<rootDir>/src/__tests__/**/*.test.{js,jsx}"],
  transform: { "^.+\\.[jt]sx?$": "babel-jest" },
  moduleNameMapper: {
    // Axios ships an ES-module build for browsers that Jest cannot load; use its CommonJS build.
    "^axios$": "<rootDir>/node_modules/axios/dist/node/axios.cjs",
    "\\.(css)$": "<rootDir>/src/test/styleStub.js",
  },
  clearMocks: true,
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/main.jsx",
    "!src/__tests__/**",
    "!src/test/**",
  ],
  coverageDirectory: "coverage",
};
