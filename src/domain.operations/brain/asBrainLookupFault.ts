import { ConstraintError } from 'helpful-errors';

import { getAllErrorClassNames } from '@src/utils/getAllErrorClassNames';

/**
 * .what = the brain slugs a failed lookup reports as registered, atoms then repls
 * .why = rhachet's `BrainChoiceNotFoundError` carries them in `metadata.available`; they
 *        are the menu a caller picks the fix from (vision forbidden cell F-1), so they
 *        must survive the cast as a plain list, never as prose to re-parse
 */
const getAllBrainSlugsAvailable = (input: { error: unknown }): string[] => {
  // only a helpful error carries a metadata bag
  if (!(input.error instanceof Error) || !('metadata' in input.error))
    return [];
  const metadata: unknown = input.error.metadata;
  if (typeof metadata !== 'object' || metadata === null) return [];
  if (!('available' in metadata)) return [];
  const available: unknown = metadata.available;
  if (typeof available !== 'object' || available === null) return [];

  // atoms then repls, each a list of slugs
  const lists = [
    'atoms' in available ? available.atoms : [],
    'repls' in available ? available.repls : [],
  ];
  const slugs = lists.flatMap((list) =>
    Array.isArray(list)
      ? list.filter((slug): slug is string => typeof slug === 'string')
      : [],
  );
  return [...new Set(slugs)];
};

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
 * .note = the registered slugs ride in `known` — the one fact that tells a locked key from
 *         a typo, and the field the review frame renders as a menu. the original message
 *         rides in `lookup` for any reader that wants its prose
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

  // an unregistered brain: name it, list what is registered, and name the two ways out
  return new ConstraintError(`brain '${input.choice}' is not registered`, {
    choice: input.choice,
    known: getAllBrainSlugsAvailable({ error: input.error }),
    lookup,
    hint: [
      "a brain registers only when its provider's package is installed and its key is unlocked;",
      'unlock the key via `rhx keyrack unlock --owner ehmpath --env prep`,',
      'or pass `--brain` with a provider whose key you hold',
    ].join(' '),
  });
};
