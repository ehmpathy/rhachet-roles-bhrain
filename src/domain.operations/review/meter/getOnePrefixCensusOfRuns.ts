import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import { asPrefixPairsOfRuns } from '@src/domain.operations/review/meter/asPrefixPairsOfRuns';
import { getOnePrefixPairOfRuns } from '@src/domain.operations/review/meter/getOnePrefixPairOfRuns';
import { getOnePrefixVerdictRollup } from '@src/domain.operations/review/meter/getOnePrefixVerdictRollup';
import type { ReviewPrefixCensus } from '@src/domain.operations/review/meter/ReviewPrefixPair';
import { getAllResultsInBoundedPool } from '@src/utils/getAllResultsInBoundedPool';

/**
 * .what = how many round pairs are measured at once
 * .why = each pair holds two open prompt files and two 64k chunks; the subject is file
 *        descriptors and a little heap, so a modest bound keeps a grove of trees under
 *        the descriptor limit while the reads still pour
 */
const BOUND_OF_CONCURRENT_PAIRS = 8;

/**
 * .what = the shared-prefix census of one tree's runs — every round beside its prior,
 *         and the verdict counts over them
 * .why = the tree and grove breadths roll this up beside the cache lever, so a 0% rate
 *        reads as a layout break or a cache miss rather than as one number
 *
 * .note = pairs never cross trees: a prior round of a reviewer is in the same log root
 *         as its next round, so the grove calls this once per tree
 */
export const getOnePrefixCensusOfRuns = async (input: {
  runs: ReviewRunMeter[];
}): Promise<ReviewPrefixCensus> => {
  const pairs = await getAllResultsInBoundedPool({
    items: asPrefixPairsOfRuns({ runs: input.runs }),
    bound: BOUND_OF_CONCURRENT_PAIRS,
    map: getOnePrefixPairOfRuns,
  });
  return { verdicts: getOnePrefixVerdictRollup({ pairs }), pairs };
};
