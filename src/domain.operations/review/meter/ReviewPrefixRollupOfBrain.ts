import type { ReviewPrefixRollup } from '@src/domain.operations/review/meter/ReviewPrefixPair';

/**
 * .what = the verdict counts over one brain's round pairs
 * .why = the row a brain axis renders beneath its cache rate
 */
export interface ReviewPrefixRollupOfBrain {
  /** the round's brain slug, or `BRAIN_OF_ABSENT_ARGS` where none was recorded */
  brain: string;
  verdicts: ReviewPrefixRollup;
}
