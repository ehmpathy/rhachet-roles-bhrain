import type { ReviewPrefixRollup } from '@src/domain.operations/review/meter/ReviewPrefixPair';

/**
 * .what = the shared-prefix verdict rollup, as the one row the tree and grove render
 * .why = the same counts at both breadths, from one render, so the two cannot drift
 *        (rule.forbid.duplicate-format-tree-operations)
 *
 * .note = a glyph marks only a nonzero count that asks for action: 🔴 on a miss (the
 *         prompt held and the cache served none), 🟡 on an over-reach (the instrument
 *         is off). a zero count carries no glyph. `unmeasured` renders only when
 *         nonzero, so the counts on the row always sum to the pairs considered
 */
export const asPrefixVerdictRollupHuman = (input: {
  rollup: ReviewPrefixRollup;
  /** the absent mark of the page it renders on — `—` on a tree, `absent` on the grove */
  absent: string;
}): string => {
  // no reviewer ran twice, so there is no pair to judge
  if (input.rollup.pairs === 0)
    return `${input.absent}  (no reviewer ran twice)`;

  // each count with its noun; a glyph only where a nonzero count asks for action
  const counts = [
    `${input.rollup.served} served`,
    `${input.rollup.missed > 0 ? '🔴 ' : ''}${input.rollup.missed} missed`,
    `${input.rollup.selfCached} self-cached`,
    `${input.rollup.overReach > 0 ? '🟡 ' : ''}${input.rollup.overReach} over-reach`,
    `${input.rollup.unshared} unshared`,
    ...(input.rollup.unmeasured > 0
      ? [`${input.rollup.unmeasured} unmeasured`]
      : []),
  ];
  return counts.join(' · ');
};
