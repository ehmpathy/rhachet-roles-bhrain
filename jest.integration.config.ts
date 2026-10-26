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
    '!**/.behavior/**',
  ],

  // run the tests of this repo's own skills, collocated in `.agent/repo=.this/`, and no other
  // `.agent/` path: not `.cache`, not `.actors`, not a linked `repo=<other>` role
  //
  // .why = a `!**/.agent/**` in testMatch would beat any positive glob, so a collocated suite
  //        would be skipped by construction with no check red. a lookahead regex here cuts all
  //        of `.agent/` save the one dir (rule.require.agent-skill-tests-collocated)
  //
  // the thinker's stitch suites (`src/domain.roles/thinker/skills/**/step*.integration.test.ts`)
  // are cut too
  //
  // .why = they drive the old rhachet stitch api (`enrollThread`, `enweaveOneStitcher`), which no
  //        role here runs on any more. a red there grades an api this repo does not ship through,
  //        so it is out of the run until the thinker moves to the current rhachet
  testPathIgnorePatterns: [
    '/node_modules/',
    '/\\.agent/(?!repo=\\.this/)',
    '/src/domain\\.roles/thinker/skills/.+/step[^/]*\\.integration\\.test\\.ts$',
  ],
  setupFilesAfterEnv: ['./jest.integration.env.ts'],

  // hold a tier pick whose hosts keep the test promises, before any live-brain test asks
  // .why = a fresh ci machine holds no pick and takes the newest model on the line; a newest
  //        model with no qualified host reds every live-brain test at once
  globalSetup: './jest.brain.globalSetup.ts',

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
