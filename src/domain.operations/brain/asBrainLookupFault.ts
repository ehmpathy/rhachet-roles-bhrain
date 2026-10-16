import { ConstraintError } from 'helpful-errors';

import { getAllErrorClassNames } from '@src/utils/getAllErrorClassNames';

/**
 * .what = the error a failed brain lookup rethrows as
 * .why = the commonest first-run slip is a brain whose provider key is locked or whose
 *        package is absent: discovery then registers no atom for it, and `rhachet` throws
 *        `BrainChoiceNotFoundError`. that is a fault the CALLER fixes, so it becomes a
 *        `ConstraintError` the cli renders under `✋ ConstraintError:` with the fix named,
 *        rather than a raw stack. every other fault passes through unchanged
 *
 * .note = the class is read by NAME (`getAllErrorClassNames`): the throw comes from
 *         `rhachet`, which may load its own copy of `helpful-errors`
 * .note = the original message rides in `lookup`, since it lists the brains that WERE
 *         registered — the one fact that tells a locked key from a typo
 */
export const asBrainLookupFault = (input: {
  error: unknown;
  choice: string;
}): unknown => {
  // any fault other than an unregistered brain is not the caller's to fix here
  const names = getAllErrorClassNames({ error: input.error });
  if (!names.includes('BrainChoiceNotFoundError')) return input.error;

  // keep the lookup's prose (its brain list), and drop the metadata json it appends
  const lookup =
    input.error instanceof Error
      ? (input.error.message.split('\n\n{')[0] ?? '').trim()
      : null;

  // an unregistered brain: name it, and name the two ways out
  return new ConstraintError(`brain '${input.choice}' is not registered`, {
    choice: input.choice,
    lookup,
    hint: [
      "a brain registers only when its provider's package is installed and its key is unlocked;",
      'unlock the key via `rhx keyrack unlock --owner ehmpath --env prep`,',
      'or pass `--brain` with a provider whose key you hold',
    ].join(' '),
  });
};
