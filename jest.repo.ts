import type { Config } from 'jest';

/**
 * .what = the jest suites this repo runs
 */
type JestSuite = 'unit' | 'integration' | 'acceptance';

/**
 * .what = the globals key that carries the practice globalSetup to `jest.repo.prepare.ts`
 * .why  = jest allows ONE globalSetup; the repo prepare runs the practice prepare it replaced,
 *         then the repo's own once-per-run steps
 */
export const JEST_REPO_GLOBALS_KEY = 'jestRepoPrepare';

/**
 * .what = the haste-map cuts this repo owes beyond the practice's `.agent/` cut
 * .why  = jest judges snapshot obsolescence over every `.snap` its haste map holds, and an
 *         obsolete snapshot fails the run while every test passes. `.log/` is the gitignored
 *         scratch dir (clamped by src/.test/jestScratchExclusion.test.ts); `.behavior/` and
 *         `.scratch/` hold records of code a route archived, never suites
 */
const CUTS_OF_REPO = [
  '<rootDir>/\\.log/',
  '<rootDir>/\\.behavior/',
  '/\\.scratch/',
];

/**
 * .what = cut all of `.agent/` save `.agent/repo=.this/`, where this repo's skill suites live
 * .why  = a `/.agent/` cut skips the collocated skill suites with no check red
 *         (rule.require.agent-skill-tests-collocated); host-local state, linked roles, and the
 *         rmsafe trash stay cut
 * .note = the lookahead accepts `repo=.this` at the end of the path too: the haste crawler tests
 *         each directory with no slash after its name, so a `repo=\.this/` lookahead prunes the dir
 */
const AGENT_SAVE_REPO_THIS = '\\.agent/(?!repo=\\.this(?:/|$))';

/**
 * .what = swap a practice `.agent/` cut for one that keeps `.agent/repo=.this/`
 */
const asAgentCutSaveRepoThis = (input: { patterns: string[] }): string[] =>
  input.patterns.map((pattern) =>
    pattern.replace(/\.agent\/$/, AGENT_SAVE_REPO_THIS),
  );

/**
 * .what = how many acceptance files run at once
 * .why  = the suite is subprocess- and network-bound, never cpu-bound: each case shells out and
 *         waits, the heaviest on a real brain. measured on a 4-core box, 117 suites: serial 2575s,
 *         8 workers 710s, 16 workers 591s. 16 drove loadavg past 33 and starved the host, so 7 is
 *         this box's courteous knee. `ACCEPTANCE_WORKERS` sweeps it on another machine
 * .note = the practice's acceptance npm commands passed `--runInBand`, which outranks config; the
 *         repo's package.json drops that flag so this value holds
 */
const getAcceptanceWorkers = (): number =>
  Number(process.env.ACCEPTANCE_WORKERS ?? 7);

/**
 * .what = extend a practice-owned jest config with every behavior this repo's config owed
 * .why  = declapract-typescript-ehmpathy declares the jest configs, envs, and prepares as exact
 *         files, with no repo seam. each config passes through this one call, so the repo's
 *         needs live in one repo-owned file and the practice files drift by two lines each
 * .note = the behaviors, per suite:
 *   - all: `.log/`, `.behavior/`, `.scratch/` cut from the haste map; `.mjs` transformed and
 *     node_modules not exempt (esm packages under pnpm)
 *   - unit: a 30s test budget (subprocess-bound cases cross jest's 5s under load)
 *   - integration: `.agent/repo=.this/` skill suites run
 *   - acceptance: a 7-worker pool
 *   - integration + acceptance: `jest.repo.env.ts` (retries, timeouts, attempt-agnostic
 *     snapshots) and `jest.repo.prepare.ts` (the brain tier pick, once per run)
 */
export const asJestConfigOfRepo = (input: {
  config: Config;
  suite: JestSuite;
}): Config => {
  const { config, suite } = input;
  const isLiveSuite = suite !== 'unit';

  // the haste-map and path cuts
  const modulePathIgnorePatterns = [
    ...(suite === 'integration'
      ? asAgentCutSaveRepoThis({
          patterns: config.modulePathIgnorePatterns ?? [],
        })
      : (config.modulePathIgnorePatterns ?? [])),
    ...CUTS_OF_REPO,
  ];
  const testPathIgnorePatterns =
    suite === 'integration'
      ? asAgentCutSaveRepoThis({
          patterns: config.testPathIgnorePatterns ?? [],
        })
      : config.testPathIgnorePatterns;

  // the esm transform the repo's deps need
  const moduleFileExtensions = [...(config.moduleFileExtensions ?? []), 'mjs'];
  const transform = { ...config.transform, '^.+\\.mjs$': '@swc/jest' };

  return {
    ...config,
    moduleFileExtensions,
    transform,
    transformIgnorePatterns: [],
    modulePathIgnorePatterns,
    testPathIgnorePatterns,
    ...(suite === 'unit' ? { testTimeout: 30_000 } : {}),
    ...(suite === 'acceptance' ? { maxWorkers: getAcceptanceWorkers() } : {}),
    ...(isLiveSuite
      ? {
          setupFilesAfterEnv: [
            ...(config.setupFilesAfterEnv ?? []),
            './jest.repo.env.ts',
          ],
          globalSetup: './jest.repo.prepare.ts',
          globals: {
            ...config.globals,
            [JEST_REPO_GLOBALS_KEY]: { suite, practice: config.globalSetup },
          },
        }
      : {}),
  };
};
