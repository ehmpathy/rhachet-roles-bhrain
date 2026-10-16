/**
 * .what = the caveat a cost figure carries at its tail, when some of the runs it
 *         sums are `unknown`
 * .why = a total over 36 of 38 runs is not the total. the caveat rides beside the
 *        figure so a reader cannot take a partial sum for a complete one.
 *
 *        ONE home for both breadths that sum costs over a group — `--of tree` and
 *        `--of grove` — so one corpus reads `$X  🟡 +3 unknown` at each, and a bare
 *        partial sum beside a legend that says "unknown reads absent" can never pass
 *        for a complete one (rule.forbid.duplicate-format-tree-operations,
 *        rule.require.single-source-of-truth-for-render).
 *
 * .note = the word is `unknown`, and it must stay `unknown`. `ReviewRunGrade` is
 *         `'metered' | 'refused' | 'unknown'` — so any other word for that grade
 *         is a synonym of a declared term, and stdout is a published cli surface,
 *         which `rule.forbid.domain-term-synonyms` names as the most expensive
 *         place to drift. the parenthetical states why the grade holds, which a
 *         single word never could.
 */
export const asUnknownCaveat = (input: { unknown: number }): string => {
  if (input.unknown === 0) return '';
  return `  🟡 +${input.unknown} unknown (cost unrecorded, not zero)`;
};
