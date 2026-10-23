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
    '**/*.acceptance.test.ts',
    '!**/.yalc/**',
    '!**/.scratch/**',
    '!**/.agent/**',
    '!**/.behavior/**',
  ],
  setupFilesAfterEnv: ['./jest.acceptance.env.ts'],

  // hold a tier pick whose hosts keep the test promises, before any live-brain test asks
  // .why = a fresh ci machine holds no pick and takes the newest model on the line; a newest
  //        model with no qualified host reds every live-brain test at once
  globalSetup: './jest.brain.globalSetup.ts',

  // keep agent caches out of the haste map
  //
  // .why = a snapshot that rmsafe moved into `.agent/.cache/.../rmsafe/trash/` reads as an
  //        obsolete snapshot, which fails the run while every test passes. obsolescence is
  //        judged over every `.snap` in the haste map, so the cut is here, not in testMatch
  //        (see jest.unit.config.ts). `.behavior/` is cut so code a route archived
  //        (`$route/archive/`) is a record, never a suite.
  modulePathIgnorePatterns: ['<rootDir>/\\.agent/\\.cache/', '<rootDir>/\\.behavior/'],

  /**
   * .what = how many test files run at once
   * .why = this suite is subprocess- and network-bound, never cpu-bound. every case
   *        shells out to a skill and waits, and the heaviest files wait on a real brain
   *        over the network. so the useful worker count is set by how many waits can be
   *        in flight, NOT by core count — a 4-core box profitably runs well past 4.
   *
   *        the prior value was 1, carried in from the repo's first import with the note
   *        "symlink race conditions in temp dir setup". that race is not reachable here:
   *        test-fns gives every fixture its own uuid-suffixed dir under
   *        /tmp/test-fns/<repo>/.temp/, and documents its shared infra as "idempotent —
   *        safe to call from parallel workers". the one genuinely shared write left was
   *        the per-fixture `rhachet roles link`, which now publishes through an atomic
   *        rename (see blackbox/.test/linkRole.ts).
   *
   *        measured on a 4-core box, 117 suites, 3252 cases, all green at each point:
   *          serial (no cache)  2575s   1.00x
   *          8 workers           710s   3.63x
   *          16 workers          591s   4.36x
   *        the gain is real and SUBLINEAR — a doubled worker count bought 1.20x — so the
   *        curve bends well above any 5m target. more workers is not the lever left; less
   *        work per case is.
   *
   * .why 7 = 16 workers drove loadavg past 33 on a 4-core box and starved every other
   *        process on it, a human's own shell included. the last ~20% of speed is not
   *        worth an unusable machine, and measurements taken up there are noisy enough
   *        to mislead (see the note below).
   *
   * .note = ⚠️ this is a SHARED, oversubscribed host. the same probe measured one npx
   *        call at 701ms and again at 1127ms minutes apart. treat any single run here as
   *        an estimate, and A/B back-to-back before you believe a delta.
   *
   * .note = override with ACCEPTANCE_WORKERS to sweep on another machine. 7 is this box's
   *        courteous knee, never a universal constant.
   */
  maxWorkers: Number(process.env.ACCEPTANCE_WORKERS ?? 7),
};

// eslint-disable-next-line import/no-default-export
export default config;
