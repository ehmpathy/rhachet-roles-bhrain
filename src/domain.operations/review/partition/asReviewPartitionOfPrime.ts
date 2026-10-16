import type { ReviewPartitionOfTargets } from './getAllTargetsByPartition';

/**
 * .what = the name a prime run carries, in its log and on stderr
 * .why = the parens mark it as no declared partition, the same way `(rest)` marks the
 *        remainder, so a reader never mistakes it for a slice of the scope
 */
export const NAME_OF_PARTITION_PRIME = '(prime)';

/**
 * .what = the partition a prime run carries: the prefix every partition shares, and naught
 *         of its own to grade
 * .why = the prime is a NAMED variant of a partition run, never an inline literal beside a
 *        loose constant. one builder, so every field a prime must leave empty is stated once
 *        (rule.forbid.magic-values)
 *
 * .note = `commonGraded` is empty: the prime is a poke that writes the shared prefix to the
 *         cache, never a review that grades it — every partition grades its own share
 */
export const asReviewPartitionOfPrime = (input: {
  common: string[];
}): ReviewPartitionOfTargets => ({
  name: NAME_OF_PARTITION_PRIME,
  globs: [],
  common: input.common,
  narrow: [],
  commonGraded: [],
});
