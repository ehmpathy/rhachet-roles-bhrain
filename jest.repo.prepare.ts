import type { Config } from 'jest';

import prepareOfAcceptance from './jest.acceptance.prepare';
import prepareOfIntegration from './jest.integration.prepare';
import { JEST_REPO_GLOBALS_KEY } from './jest.repo';
import { DEFAULT_TEST_BRAIN } from './src/.test/genTestBrainContext';
import { sdkBrainTierPick } from './src/.test/sdkBrainTierPick';
import { setBrainTierPickQualified } from './src/.test/setBrainTierPickQualified';

/**
 * .what = the practice prepare each live suite owes, by suite
 */
const PREPARE_OF_SUITE = {
  integration: prepareOfIntegration,
  acceptance: prepareOfAcceptance,
} as const;

/**
 * .what = jest globalSetup for the live suites: the practice prepare, then the repo's own
 *         once-per-run steps
 * .why  = jest allows ONE globalSetup, and the practice declares its prepare as an exact file.
 *         `jest.repo.ts` points the config here and stamps which suite runs
 * .how  =
 *   1. the practice prepare: livedb wake, keyrack source, test-fns autoprune
 *   2. the brain tier pick: a fresh ci machine holds no pick and takes the newest model on the
 *      tier line. when that model has no host that keeps the test promises, every live-brain test
 *      fails at once, on every shard. this holds a model that keeps the promises. it runs after
 *      the keyrack source, so the probe asks with the run's creds
 * .note = relative imports only: jest loads a globalSetup before the moduleNameMapper exists
 */
// biome-ignore lint/style/noDefaultExport: jest globalSetup api requires default export
export default async (
  globalConfig: { globalTeardown?: string | null },
  projectConfig: Config,
): Promise<void> => {
  // run the practice prepare this suite owes
  const { suite } = projectConfig.globals?.[JEST_REPO_GLOBALS_KEY] as {
    suite: keyof typeof PREPARE_OF_SUITE;
  };
  await PREPARE_OF_SUITE[suite](globalConfig);

  // hold a tier pick whose hosts keep the test promises
  const result = await setBrainTierPickQualified(
    { slugTest: DEFAULT_TEST_BRAIN },
    { sdk: sdkBrainTierPick },
  );
  console.log(
    `🦉 brain tier pick: ${result.status}${result.model ? ` (${result.model})` : ''}`,
  );
};
