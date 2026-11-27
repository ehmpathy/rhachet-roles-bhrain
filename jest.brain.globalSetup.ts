import { existsSync } from 'fs';
import { join } from 'path';
import { keyrack } from 'rhachet/keyrack';

import { asTestBrainKeyName } from './src/.test/asTestBrainKeyName';
import { DEFAULT_TEST_BRAIN } from './src/.test/genTestBrainContext';
import { sdkBrainTierPick } from './src/.test/sdkBrainTierPick';
import { setBrainTierPickQualified } from './src/.test/setBrainTierPickQualified';

/**
 * .what = runs once before a jest run that drives a live brain
 * .why = a fresh ci machine holds no tier pick, so its first ask takes the newest model on the
 *        tier line. when that model has no host that keeps the test promises, every live-brain
 *        test fails at once, on every shard, and a retry cannot help. this holds a model that
 *        keeps the promises, as a machine that picked last week already does. a model that
 *        cannot be held fails the run here, once, with the cause
 *
 * .note = the same keyrack source the env files call, so the probe asks with the test creds
 * .note = relative imports only: jest loads a globalSetup without the moduleNameMapper
 */
// eslint-disable-next-line import/no-default-export
export default async (): Promise<void> => {
  if (existsSync(join(process.cwd(), '.agent/keyrack.yml')))
    keyrack.source({ env: 'test', owner: 'ehmpath', mode: 'lenient' });

  // no brain key, no probe: a keyless run holds only suites that call no model, and a
  // live-brain test that runs anyway demands its key in genTestBrainContext
  const keyName = asTestBrainKeyName({ brain: DEFAULT_TEST_BRAIN });
  if (!process.env[keyName]) {
    console.log(`🦉 brain tier pick: skipped (${keyName} not set)`);
    return;
  }

  const result = await setBrainTierPickQualified(
    { slugTest: DEFAULT_TEST_BRAIN },
    { sdk: sdkBrainTierPick },
  );
  console.log(
    `🦉 brain tier pick: ${result.status}${result.model ? ` (${result.model})` : ''}`,
  );
};
