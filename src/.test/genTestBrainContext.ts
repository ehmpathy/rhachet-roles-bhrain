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
 * .why = fireworks/deepseek/v4-flash is fast, cheap, and effective for agentic code tasks
 */
export const DEFAULT_TEST_BRAIN = 'fireworks/deepseek/v4-flash';

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
 * .what = default keyrack creds for tests
 * .why = enables keyrack to read env vars exported by keyrack firewall in CI
 */
const DEFAULT_TEST_CREDS = {
  keyrack: { owner: 'ehmpath', env: 'test' },
} as const;

/**
 * .what = creates a brain context for tests
 * .why = enables integration tests to invoke brain-dependent operations
 *
 * .note = this is a TEST UTILITY only; prod code should receive brain context via DI
 * .note = defaults to keyrack creds for test env; keyrack firewall exports env vars in CI
 */
export const genTestBrainContext = (input: {
  brain: string;
  creds?: { keyrack: { owner: string; env: string } };
}): ContextBrain<BrainChoice> => {
  const atoms = loadAllAtoms();
  const repls = loadAllRepls();

  return genContextBrain({
    brains: { atoms, repls },
    choice: input.brain,
    creds: input.creds ?? DEFAULT_TEST_CREDS,
  });
};
