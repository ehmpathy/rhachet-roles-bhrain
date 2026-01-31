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
import { getBrainAtomsByXAI } from 'rhachet-brains-xai';

/**
 * .what = default brain for tests
 * .why = xai/grok/code-fast-1 is fast, cheap, and effective for agentic code tasks
 */
export const DEFAULT_TEST_BRAIN = 'xai/grok/code-fast-1';

/**
 * .what = loads all available brain atoms from installed packages
 * .why = enables enumeration of available brains for lookup
 */
const loadAllAtoms = (): BrainAtom[] => {
  return [
    ...getBrainAtomsByXAI(),
    ...getBrainAtomsByAnthropic(),
    ...getBrainAtomsByOpenAI(),
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
 */
export const genTestBrainContext = (input: {
  brain: string;
}): ContextBrain<BrainChoice> => {
  const atoms = loadAllAtoms();
  const repls = loadAllRepls();
  return genContextBrain({ atoms, repls, choice: input.brain });
};
