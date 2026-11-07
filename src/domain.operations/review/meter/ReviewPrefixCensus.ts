import type {
  ReviewPrefixPair,
  ReviewPrefixRollup,
} from '@src/domain.operations/review/meter/ReviewPrefixPair';
import type { ReviewPrefixRollupOfBrain } from '@src/domain.operations/review/meter/ReviewPrefixRollupOfBrain';

/**
 * .what = the shared-prefix census of a corpus — the rollup, and the pairs it counts
 * .why = the json a tree or grove emits carries the same figures its render rolls up
 */
export interface ReviewPrefixCensus {
  verdicts: ReviewPrefixRollup;
  /**
   * the verdict counts per brain, keyed by the round's brain, heaviest first
   *
   * .why = a cache rate per brain says how much each brain cached; these counts say WHY
   *        a brain cached naught — the layout, the clock, or the cache itself
   */
  byBrain: ReviewPrefixRollupOfBrain[];
  pairs: ReviewPrefixPair[];
}
