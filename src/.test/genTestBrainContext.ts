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
import { getBrainAtomsByFireworksAI } from 'rhachet-brains-fireworksai';
import {
  getBrainAtomsByOpenAI,
  getBrainReplsByOpenAI,
} from 'rhachet-brains-openai';
import { getBrainAtomsByXAI } from 'rhachet-brains-xai';

/**
 * .what = default brain for tests
 * .why = xai/grok/code-fast-1 is fast, cheap, and effective for agentic code tasks
 *
 * .note = fireworks/deepseek/v4-flash would be preferred but FIREWORKS_API_KEY is not yet in CI
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
    ...getBrainAtomsByFireworksAI(),
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
 * .note = keyrack firewall exports env vars in CI; atoms fall back to env vars when creds is undefined
 * .note = xai brain doesn't support keyrack shorthand yet — keyrack config causes errors
 */
export const genTestBrainContext = (input: {
  brain: string;
}): ContextBrain<BrainChoice> => {
  const atoms = loadAllAtoms();
  const repls = loadAllRepls();

  // note: creds omitted — atoms fall back to env vars set by keyrack firewall
  // keyrack shorthand breaks xai brain (rhachet-brains-xai@0.3.3 doesn't handle it)
  return genContextBrain({
    brains: { atoms, repls },
    choice: input.brain,
  });
};
