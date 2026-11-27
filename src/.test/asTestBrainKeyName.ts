import { ConstraintError } from 'helpful-errors';

/**
 * .what = the env var a live brain needs, read off its provider prefix
 * .why = the integration setup sources the test keys leniently, so a suite that calls no
 *        model runs with no key set. a suite that does call one must still demand its key,
 *        and the key it needs is named by the brain's provider
 */
export const asTestBrainKeyName = (input: { brain: string }): string => {
  // read the provider off the slug head
  const provider = input.brain.split('/')[0];
  if (provider === 'openrouter') return 'OPENROUTER_API_KEY';
  if (provider === 'anthropic') return 'ANTHROPIC_API_KEY';
  if (provider === 'openai') return 'OPENAI_API_KEY';
  if (provider === 'xai') return 'XAI_API_KEY';

  // an unmapped provider is a test setup defect; name the slug and the fix
  return ConstraintError.throw('no test key is mapped for this brain provider', {
    brain: input.brain,
    provider,
    hint: 'add the provider to asTestBrainKeyName',
  });
};
