/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  "timers": "fake",
  "transform": {
    "^.+\\.[t|j]sx?$": "babel-jest"
  },
  testMatch: [
    '**/test/**/*.[jt]s?(x)',
    '!**/test/coverage/**',
    '!**/test/utils/**',
    '!**/test/images/**',
  ],
};
