/**
 * @jest-config-loader esbuild-register
 */
import type { Config } from 'jest';

// ensure tests run in utc, like they will on cicd and on server; https://stackoverflow.com/a/56277249/15593329
process.env.TZ = 'UTC';

// ensure tests run like on local machines, so snapshots are equal on local && cicd
process.env.FORCE_COLOR = 'true';

// https://jestjs.io/docs/configuration
const config: Config = {
  verbose: true,
  reporters: [['default', { summaryThreshold: 0 }]], // ensure we always get a failure summary at the bottom, to avoid the hunt
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'mjs', 'ts'],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
    '^.+\\.mjs$': '@swc/jest',
  },
  transformIgnorePatterns: [
    // empty = transform all node_modules (needed for esm packages in pnpm)
  ],
  testMatch: [
    // note: order matters
    '**/*.test.ts',
    '!**/*.acceptance.test.ts',
    '!**/*.integration.test.ts',
    '!**/.yalc/**',
    '!**/.scratch/**',
    '!**/.agent/**',
  ],
  setupFilesAfterEnv: ['./jest.unit.env.ts'],

  // grant every unit test a 30s budget, rather than jest's 5s default
  //
  // .why = many unit tests here spawn a real subprocess (a route guard, a git op) and
  //        wait for its verdict. that honest runtime sits just under 5s when the machine
  //        is idle — measured at 3890ms and 5188ms for two neighbour cases — so under a
  //        loaded suite it crosses. the failure then reads as a defect in the code under
  //        test rather than in the budget granted to the test.
  //
  // .why here and not per file = a per-file clamp is a list maintained by hand, so the
  //        next spawn test added flakes until someone remembers. a config default cannot
  //        be forgotten (rule.require.clamp-edge-cases: clamp the boundary, never the
  //        cases observed to cross it).
  //
  // .note = a fast test does not become slow because it is allowed to be. the only cost
  //        is that a genuinely hung test takes 30s to fail instead of 5s.
  testTimeout: 30_000,

  // use 50% of threads to leave headroom for other processes
  maxWorkers: '50%', // https://stackoverflow.com/questions/71287710/why-does-jest-run-faster-with-maxworkers-50
};

// eslint-disable-next-line import/no-default-export
export default config;
