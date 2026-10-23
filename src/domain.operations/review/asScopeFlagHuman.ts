import { getAllScopeFlagValues } from '@src/domain.operations/review/getAllScopeFlagValues';

/**
 * .what = renders what a scope flag was given — `--rules`, `--diffs`, `--paths` — for a
 *         human who is about to read why their review overran its window
 * .why = each flag arrives as a scalar, an array, or absent; one named operation
 *        renders all three shapes the same way, rather than logic inlined at
 *        each call site (rule.forbid.inline-decode-friction,
 *        rule.prefer.wet-over-dry).
 *
 * .note = absent renders `(none)`, never an empty string — a driver reads this
 *         line to judge which flag widened their scope, and a blank after
 *         `paths:` cannot be told from a render that failed
 *         (rule.forbid.unexpected-defaults).
 *
 * .note = it takes `of` to match `asFigureHuman({ of })`, its peer on the same diagnostic
 *         block, so the two read alike where they sit two lines apart.
 *
 * .note = what this is NOT: `asGlobList` takes the identical argument shape
 *         and is a different act (rule.forbid.domain-term-ambiguity).
 *
 *        | | `asGlobList` | this |
 *        |---|---|---|
 *        | answers | `string[]` an enumerator walks | `string` a human reads |
 *        | on absent | `[]` | `(none)` |
 *        | on `''` | drops it — an empty glob widens a lane | renders `(none)` — a blank reads as a failed render |
 *
 *        one drops `''` to protect a matcher; the other drops it to protect a
 *        reader. do not fold the two.
 */
export const asScopeFlagHuman = (input: {
  of: string | string[] | undefined;
}): string => {
  // emptiness is judged on the values, never on the container — `[]` is
  // truthy, so a container-only guard would render a blank after `paths:`,
  // the one read this operation exists to prevent
  const given = getAllScopeFlagValues({ of: input.of });

  if (!given.length) return '(none)';
  return given.join(', ');
};
