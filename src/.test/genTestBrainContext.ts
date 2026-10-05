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
import { getBrainAtomsByOpenRouter } from 'rhachet-brains-openrouter';

import { DEFAULT_REVIEW_BRAIN } from '@src/domain.operations/review/DEFAULT_REVIEW_BRAIN';

/**
 * .what = default brain for tests
 * .why = the tests exercise the brain the product defaults to, so they read the same constant
 * .note = a tier slug, not a pinned model — see DEFAULT_REVIEW_BRAIN's .note. a test that
 *         drifts with no diff here may owe its cause to a new model behind the tier
 */
export const DEFAULT_TEST_BRAIN = DEFAULT_REVIEW_BRAIN;

/**
 * .what = loads all available brain atoms from installed packages
 * .why = enables enumeration of available brains for lookup
 */
const loadAllAtoms = (): BrainAtom[] => {
  return [
    ...getBrainAtomsByAnthropic(),
    ...getBrainAtomsByOpenAI(),
    ...getBrainAtomsByOpenRouter(),
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
 */
export const genTestBrainContext = (input: {
  brain: string;
}): ContextBrain<BrainChoice> => {
  const atoms = loadAllAtoms();
  const repls = loadAllRepls();

  return genContextBrain({
    brains: { atoms, repls },
    choice: input.brain,
    creds: { keyrack: { owner: 'ehmpath', env: 'test' } },
  });
};
