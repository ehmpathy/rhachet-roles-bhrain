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
    '!**/.behavior/**',
  ],
  setupFilesAfterEnv: ['./jest.unit.env.ts'],

  // keep agent caches out of the haste map
  //
  // .why = rmsafe moves a deleted file into `.agent/.cache/.../rmsafe/trash/`. a trashed
  //        `__snapshots__/*.snap` whose test was not trashed beside it reads to jest as an
  //        obsolete snapshot, and an obsolete snapshot fails the run while every test passes.
  //        testMatch cannot help: snapshot obsolescence is judged over every `.snap` the haste
  //        map holds, never over the matched tests. so the cache is cut from the map itself.
  //        `.log/` is the repo's gitignored scratch dir, and a baseline `.snap` parked there
  //        fails the run the same way (clamped by src/.test/jestScratchExclusion.test.ts).
  //        `.behavior/` is cut so code a route archived (`$route/archive/`) is a record,
  //        never a suite
  modulePathIgnorePatterns: [
    '<rootDir>/\\.agent/\\.cache/',
    '<rootDir>/\\.log/',
    '<rootDir>/\\.behavior/',
  ],

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
