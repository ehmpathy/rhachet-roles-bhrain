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
    '^@/(.*)$': '<rootDir>/$1',
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
    '**/*.integration.test.ts',
    '!**/.yalc/**',
    '!**/.scratch/**',
    '!**/.agent/**',
    '!**/.behavior/**',
  ],
  setupFilesAfterEnv: ['./jest.integration.env.ts'],

  // keep agent caches out of the haste map
  //
  // .why = a snapshot that rmsafe moved into `.agent/.cache/.../rmsafe/trash/` reads as an
  //        obsolete snapshot, which fails the run while every test passes. obsolescence is
  //        judged over every `.snap` in the haste map, so the cut is here, not in testMatch
  //        (see jest.unit.config.ts). `.log/`, the gitignored scratch dir, is cut for the
  //        same reason. `.behavior/` is cut so code a route archived (`$route/archive/`) is
  //        a record, never a suite.
  modulePathIgnorePatterns: [
    '<rootDir>/\\.agent/\\.cache/',
    '<rootDir>/\\.log/',
    '<rootDir>/\\.behavior/',
  ],

  // use 50% of threads to leave headroom for other processes
  maxWorkers: '50%', // https://stackoverflow.com/questions/71287710/why-does-jest-run-faster-with-maxworkers-50
};

// eslint-disable-next-line import/no-default-export
export default config;
