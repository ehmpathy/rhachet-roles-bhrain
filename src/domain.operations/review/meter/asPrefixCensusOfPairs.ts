import { getAllPrefixRollupsByBrain } from '@src/domain.operations/review/meter/getAllPrefixRollupsByBrain';
import { getOnePrefixVerdictRollup } from '@src/domain.operations/review/meter/getOnePrefixVerdictRollup';
import type { ReviewPrefixCensus } from '@src/domain.operations/review/meter/ReviewPrefixCensus';
import type { ReviewPrefixPair } from '@src/domain.operations/review/meter/ReviewPrefixPair';

/**
 * .what = the census of a set of round pairs — the corpus rollup, one rollup per brain, and
 *         the pairs themselves
 * .why = the tree and the grove each collect their pairs their own way, and compose the
 *        census here, once, so a new field on the census lands in both breadths at once
 */
export const asPrefixCensusOfPairs = (input: {
  pairs: ReviewPrefixPair[];
}): ReviewPrefixCensus => ({
  verdicts: getOnePrefixVerdictRollup({ pairs: input.pairs }),
  byBrain: getAllPrefixRollupsByBrain({ pairs: input.pairs }),
  pairs: input.pairs,
});
