import { isGuardValueLiteral } from './isGuardValueLiteral';

/**
 * .what = the characters a refused guard value holds that the literal set does not admit,
 *         plus a paste-able repair DERIVED FROM THAT VALUE where one is honest
 *
 * .why = the refused value is the one piece of intent the surface holds. a canned example
 *        (`brain: gpt-4o@latest` → paste `claude-sonnet-5[1m]`) discards the model the
 *        driver chose, so it is no fix (`rule.require.errors-name-the-fix`)
 *
 * 🔴 .note = a SPACE yields no repair: `gpt 4o` strips to `gpt4o`, a valid slug the driver
 *           never wrote. a space means two words where `/model` takes one, so the honest
 *           answer names that and offers no paste (`rule.forbid.failhide`). every other
 *           refused character is a stray mark (`'`, `@`, `%`), and its strip yields the slug
 *           the driver plainly meant
 * .note = the per-character test REUSES `isGuardValueLiteral`, so the set cannot drift
 * .note = `refused` is distinct, in first-seen order — a reader repairs a class of mark
 */
export const asGuardValueRepair = (input: {
  value: string;
}): { refused: string[]; spaced: boolean; repaired: string | null } => {
  const refused = [...new Set([...input.value])].filter(
    (char) => !isGuardValueLiteral({ value: char }),
  );

  // a space is refused AND unrepairable, so it gets its own flag the render branches on
  const spaced = refused.includes(' ');

  // strip every refused character, then ask whether what is left is a literal. an empty
  // result (`brain: @@@`) yields null, so the caller falls back to its example
  const stripped = [...input.value]
    .filter((char) => isGuardValueLiteral({ value: char }))
    .join('');

  const repairable =
    !spaced && stripped !== '' && isGuardValueLiteral({ value: stripped });

  return { refused, spaced, repaired: repairable ? stripped : null };
};
