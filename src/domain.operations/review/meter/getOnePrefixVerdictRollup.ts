import type {
  ReviewPrefixPair,
  ReviewPrefixRollup,
  ReviewPrefixVerdict,
} from '@src/domain.operations/review/meter/ReviewPrefixPair';

/**
 * .what = the rollup field each verdict counts into
 * .why = a `Record` over the whole union, so a sixth verdict goes red at compile time
 *        until it names the field it counts into
 */
const FIELD_OF_VERDICT: Record<
  ReviewPrefixVerdict,
  keyof Omit<ReviewPrefixRollup, 'pairs' | 'unmeasured'>
> = {
  served: 'served',
  missed: 'missed',
  'self-cached': 'selfCached',
  'over-reach': 'overReach',
  unshared: 'unshared',
};

/**
 * .what = the verdict counts over a set of round pairs
 * .why = the one-line rollup the tree and grove render beside the cache lever. the
 *        counts sum to `pairs` by construction: a pair with no verdict counts as
 *        `unmeasured`, never dropped, so a reader can weigh the counts against coverage
 */
export const getOnePrefixVerdictRollup = (input: {
  pairs: ReviewPrefixPair[];
}): ReviewPrefixRollup =>
  input.pairs.reduce<ReviewPrefixRollup>(
    (rollup, pair) => {
      const field =
        pair.verdict === null ? 'unmeasured' : FIELD_OF_VERDICT[pair.verdict];
      return { ...rollup, [field]: rollup[field] + 1 };
    },
    {
      pairs: input.pairs.length,
      served: 0,
      missed: 0,
      selfCached: 0,
      overReach: 0,
      unshared: 0,
      unmeasured: 0,
    },
  );
