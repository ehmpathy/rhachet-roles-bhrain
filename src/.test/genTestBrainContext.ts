import {
  type BrainAtom,
  type BrainChoice,
  type BrainRepl,
  type ContextBrain,
  genContextBrain,
} from 'rhachet';
import {
  getBrainAtomsByAnthropic,
  getBrainReplsByAnthropic,
} from 'rhachet-brains-anthropic';
import {
  getBrainAtomsByOpenAI,
  getBrainReplsByOpenAI,
} from 'rhachet-brains-openai';
import {
  type BrainAtomSlugOpenRouterFiltered,
  genBrainAtom,
  getBrainAtomsByOpenRouter,
} from 'rhachet-brains-openrouter';

import { BRAIN_DEFAULT_OF_REVIEW } from '@src/domain.operations/brain/BRAIN_DEFAULT_OF_REVIEW';

/**
 * .what = default brain for tests
 * .why = deepseek flash is fast, cheap, and effective for agentic code tasks
 *
 * .note = versionless (rule.require.versionless-brain-defaults): a tier slug picks the newest
 *         live model at ask time, so a provider rename never fails setup
 * .note = min100tps, not the tier's min50tps: a host whose median straddles 50 serves slow
 *         asks that cross the jest bound (morph/fp8 at 12–64 tps, 2026-10-05). the product
 *         default stays the bare tier (BRAIN_DEFAULT_OF_REVIEW); only tests narrow it
 * .note = in-process only; a CLI-driven test uses DEFAULT_TEST_BRAIN_VIA_CLI
 */
export const DEFAULT_TEST_BRAIN: BrainAtomSlugOpenRouterFiltered =
  'openrouter/deepseek/flash/floor&speed=min100tps&privacy=full';

/**
 * .what = the test brain for a LIVE cache measurement — the default test brain minus `floor`
 * .why = the floor ranks hosts by sticker input alone, so it lands on the cheapest host whether
 *        or not it caches, and a precision pin only moves the trap (Wafer 2026-10-10, then
 *        Makora/fp8 2026-10-17: every round cache read 0). with no `floor`, openrouter's balancer
 *        picks among the qualified set and keeps a repeated prefix on its warm host
 * .note = the host rank itself is owed upstream (fulcrum F186,
 *         `.dream/v2026_10_08.reseed.openrouter-floor-ranks-by-sticker-input-…`)
 */
export const DEFAULT_TEST_BRAIN_OF_LIVE_CACHE: BrainAtomSlugOpenRouterFiltered =
  'openrouter/deepseek/flash/speed=min100tps&privacy=full';

/**
 * .what = the test brain a CLI-driven (blackbox) test passes as --brain
 * .why = the CLI selects a brain by exact `atom.slug` among the package's LISTED atoms, and
 *        rhachet-brains-openrouter lists bare tiers plus one filtered slug (min50tps). the
 *        min100tps slug is unlisted, so the CLI would refuse it
 * .note = converges onto DEFAULT_TEST_BRAIN once the package lists the min100tps slug
 * .note = reads the product default, so a vendor swap moves CLI tests with it
 */
export const DEFAULT_TEST_BRAIN_VIA_CLI = BRAIN_DEFAULT_OF_REVIEW;

/**
 * .what = loads all available brain atoms from installed packages
 * .why = enables enumeration of available brains for lookup
 */
const loadAllAtoms = (): BrainAtom[] => {
  return [
    ...getBrainAtomsByAnthropic(),
    ...getBrainAtomsByOpenAI(),
    ...getBrainAtomsByOpenRouter(),
    // the package registers bare tiers only; the test slug is built here so it is selectable
    genBrainAtom({ slug: DEFAULT_TEST_BRAIN }),
    genBrainAtom({ slug: DEFAULT_TEST_BRAIN_OF_LIVE_CACHE }),
  ];
};

/**
 * .what = loads all available brain repls from installed packages
 * .why = enables enumeration of available brains for lookup
 */
const loadAllRepls = (): BrainRepl[] => {
  return [...getBrainReplsByAnthropic(), ...getBrainReplsByOpenAI()];
};

/**
 * .what = creates a brain context for tests
 * .why = enables integration tests to invoke brain-dependent operations
 *
 * .note = this is a TEST UTILITY only; prod code should receive brain context via DI
 * .note = uses keyrack shorthand to fetch credentials for openrouter/anthropic/openai brains
 * .note = the choice passes straight to `genContextBrain`, as every prod call site does: a
 *         versionless openrouter tier slug is registered as is
 *         (rule.require.versionless-brain-defaults)
 */
export const genTestBrainContext = async (input: {
  brain: string;
}): Promise<ContextBrain<BrainChoice>> => {
  const atoms = loadAllAtoms();
  const repls = loadAllRepls();

  return genContextBrain({
    brains: { atoms, repls },
    // the lookup matches registered slugs only
    choice: input.brain,
    creds: { keyrack: { owner: 'ehmpath', env: 'test' } },
  });
};
