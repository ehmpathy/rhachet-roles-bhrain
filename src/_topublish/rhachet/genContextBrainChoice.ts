import { BadRequestError } from 'helpful-errors';
import {
  type BrainAtom,
  type BrainChoice,
  type BrainRepl,
  type ContextBrain,
  genContextBrain,
  getAvailableBrainsInWords,
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
 * .what = env var names by provider
 * .why = enables clear error messages when api key is absent
 */
const ENV_VAR_BY_PROVIDER: Record<string, string> = {
  xai: 'XAI_API_KEY',
  claude: 'ANTHROPIC_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
};

/**
 * .what = loads all available brain atoms from installed packages
 * .why = enables enumeration of available brains for lookup and help output
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
 * .why = enables enumeration of available brains for lookup and help output
 */
const loadAllRepls = (): BrainRepl[] => {
  return [...getBrainReplsByAnthropic(), ...getBrainReplsByOpenAI()];
};

/**
 * .what = extracts provider from brain ref slug
 * .why = enables api key validation by provider
 *
 * .example
 *   getProviderFromSlug({ slug: 'xai/grok/code-fast-1' }) => 'xai'
 *   getProviderFromSlug({ slug: 'anthropic/claude/sonnet' }) => 'anthropic'
 */
const getProviderFromSlug = (input: { slug: string }): string => {
  const [provider] = input.slug.split('/');
  if (!provider)
    throw new BadRequestError('invalid brain ref: no provider', {
      slug: input.slug,
    });
  return provider;
};

/**
 * .what = validates api key is present for provider
 * .why = fails fast with clear error message when api key is absent
 */
const validateApiKeyPresent = (input: { provider: string }): void => {
  const envVar = ENV_VAR_BY_PROVIDER[input.provider];
  if (!envVar) return; // unknown provider, skip validation

  const value = process.env[envVar];
  if (!value) {
    throw new BadRequestError(
      `api key not found for provider: ${input.provider}. set ${envVar} environment variable`,
      { provider: input.provider, envVar },
    );
  }
};

/**
 * .what = resolves a brain ref to context.brain.choice
 * .why = enables skills to access a chosen brain via context.brain.choice.ask() and .act()
 *
 * .example
 *   const ctx = genContextBrainChoice({ brain: 'xai/grok/code-fast-1' });
 *   const result = await ctx.brain.choice.ask({ prompt: '...', schema: { output: z.string() } });
 */
export const genContextBrainChoice = (input: {
  brain: string;
}): ContextBrain<BrainChoice> => {
  // load all brains
  const atoms = loadAllAtoms();
  const repls = loadAllRepls();

  // validate api key is present before lookup (fail fast)
  const provider = getProviderFromSlug({ slug: input.brain });
  validateApiKeyPresent({ provider });

  // generate context with choice via rhachet's genContextBrain
  return genContextBrain({ atoms, repls, choice: input.brain });
};

/**
 * .what = default brain for skills when none specified
 * .why = xai/grok/code-fast-1 is fast, cheap, and effective for agentic code tasks
 */
export const DEFAULT_BRAIN = 'xai/grok/code-fast-1';

/**
 * .what = prints available brains to console and returns formatted string
 * .why = enables cli --brain help output
 */
export const printBrainHelp = (): string => {
  const atoms = loadAllAtoms();
  const repls = loadAllRepls();
  const help = getAvailableBrainsInWords({ atoms, repls, choice: '' });
  console.log(help);
  console.log(`\ndefault: ${DEFAULT_BRAIN}`);
  return help;
};
