import { asPrefixVerdictRollupHuman } from '@src/domain.operations/review/meter/asPrefixVerdictRollupHuman';
import { getOnePrefixVerdictRollup } from '@src/domain.operations/review/meter/getOnePrefixVerdictRollup';
import type { ReviewPrefixRollupOfBrain } from '@src/domain.operations/review/meter/ReviewPrefixRollupOfBrain';

/**
 * .what = the `pairs:` leaf a brain row hangs — that brain's prefix verdicts
 * .why = the tree and the grove both hang it beneath a brain row. one render keeps the
 *        label, the brain lookup, and the empty fallback alike at both breadths, so the
 *        two cannot drift on one fact (rule.forbid.duplicate-format-tree-operations)
 *
 * .note = a brain that ran no reviewer twice has no rollup of its own; it renders as the
 *         empty rollup does, so its row still says why it shows no verdicts
 */
export const asPrefixVerdictLeafOfBrain = (input: {
  /** the census's per-brain rollups (`getAllPrefixRollupsByBrain`) */
  byBrain: ReviewPrefixRollupOfBrain[];
  /** the brain row's key */
  brain: string;
  /** the breadth's absent mark */
  absent: string;
}): string => {
  const rollup =
    input.byBrain.find((one) => one.brain === input.brain)?.verdicts ??
    getOnePrefixVerdictRollup({ pairs: [] });
  return `pairs: ${asPrefixVerdictRollupHuman({ rollup, absent: input.absent })}`;
};
