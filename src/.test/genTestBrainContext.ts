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
 * .note = 🔴 versionless (rule.require.versionless-brain-defaults). a pinned default
 *         goes stale the day its provider renames a version, and fails every suite at
 *         setup with `BrainChoiceNotFoundError` before one assertion runs. an openrouter
 *         tier slug names no version at all — the package picks the newest live model on
 *         the tier's line at ask time
 * .note = the tier's default supply (`floor&speed=min50tps&privacy=full`) routes each ask to
 *         the cheapest-by-input host whose 30-min median clears 50 tps, alone, with no fallback.
 *         a host whose median straddles 50 then serves every ask at its live speed: measured
 *         2026-10-05, morph/fp8 served 19–64 tps (as low as 12 by its own median), and slow
 *         reviews crossed the jest bound. tests assert correctness, never latency, so they
 *         demand 100 tps — measured the same hour, coreweave/fp8 at 132–227 tps.
 *         the PRODUCT default stays the bare tier (BRAIN_DEFAULT_OF_REVIEW); only tests narrow it
 * .note = in-process only: `genTestBrainContext` registers this slug itself. a test that
 *         drives the CLI uses DEFAULT_TEST_BRAIN_VIA_CLI, since the CLI selects only the
 *         slugs the package lists
 */
export const DEFAULT_TEST_BRAIN: BrainAtomSlugOpenRouterFiltered =
  'openrouter/deepseek/flash/floor&speed=min100tps&privacy=full';

/**
 * .what = the test brain for a LIVE cache measurement — the default test brain, narrowed to
 *         fp8 hosts
 * .why = a pin chosen for measurement (rule.require.versionless-brain-defaults false positive).
 *        the floor ranks hosts by sticker input rate alone, so it picks the cheapest host
 *        whether or not that host caches. measured 2026-10-10: every round of three attempts
 *        landed on Wafer (quantization `unknown`, `supports_implicit_caching: false`) and read
 *        `cache.get` of at most one 1k head block — a 0% figure that says naught of the prompt
 *        layout the suite exists to grade. `precision=fp8` excludes the `unknown` hosts and
 *        lands on an fp8 host; CoreWeave/fp8 measured 2026-10-05 served round 2 warm at 99.7%
 * .note = still versionless: an openrouter tier names no model version
 * .note = the host rank itself is owed upstream — `.dream/v2026_10_08.reseed.openrouter-floor-
 *         ranks-by-sticker-input-and-picks-a-host-that-never-caches.md` (fulcrum F186)
 */
export const DEFAULT_TEST_BRAIN_OF_LIVE_CACHE: BrainAtomSlugOpenRouterFiltered =
  'openrouter/deepseek/flash/floor&speed=min100tps&privacy=full&precision=fp8';

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
