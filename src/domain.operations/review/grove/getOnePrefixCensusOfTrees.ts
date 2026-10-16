import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import type { ReviewTree } from '@src/domain.operations/review/grove/getAllReviewTrees';
import { getOnePrefixCensusOfRuns } from '@src/domain.operations/review/meter/getOnePrefixCensusOfRuns';
import { getOnePrefixVerdictRollup } from '@src/domain.operations/review/meter/getOnePrefixVerdictRollup';
import type { ReviewPrefixCensus } from '@src/domain.operations/review/meter/ReviewPrefixPair';
import { getAllResultsInBoundedPool } from '@src/utils/getAllResultsInBoundedPool';

/**
 * .what = how many trees are paired at once
 * .why = each tree's census already pours its own pairs; the same bound the grove's
 *        tree read uses keeps a machine of many trees under the descriptor limit
 */
const BOUND_OF_CONCURRENT_TREES = 2;

/**
 * .what = the shared-prefix census of a grove — each readable tree's pairs, joined,
 *         and the verdict counts over all of them
 * .why = pairs never cross trees, since a round's prior sits in the same log root, so
 *        the grove pairs each tree on its own and sums the pairs. one rollup over the
 *        joined pairs, so the grove counts read exactly as a sum of its trees' counts
 */
export const getOnePrefixCensusOfTrees = async (input: {
  readable: Array<{ tree: ReviewTree; runs: ReviewRunMeter[] }>;
}): Promise<ReviewPrefixCensus> => {
  const censuses = await getAllResultsInBoundedPool({
    items: input.readable,
    bound: BOUND_OF_CONCURRENT_TREES,
    map: (one) => getOnePrefixCensusOfRuns({ runs: one.runs }),
  });
  const pairs = censuses.flatMap((census) => census.pairs);
  return { verdicts: getOnePrefixVerdictRollup({ pairs }), pairs };
};
