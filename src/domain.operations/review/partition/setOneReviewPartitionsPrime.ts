import { withPrimeFaultSurvived } from '@src/domain.operations/review/prime/withPrimeFaultSurvived';
import type { StepReviewInput } from '@src/domain.operations/review/StepReviewInput';
import type { StepReviewResult } from '@src/domain.operations/review/StepReviewResult';

import { asReviewPartitionOfPrime } from './asReviewPartitionOfPrime';
import { asReviewPartitionOutputPath } from './asReviewPartitionOutputPath';
import type { ReviewPartitionRunStep } from './ReviewPartitionRunStep';

/**
 * .what = the prime run of the prefix every partition shares — its result, or the fault it
 *         survived — or neither where there is none to prime
 * .why = the prime is an optimization, never a gate (`rule.forbid.cold-pour-of-a-shared-prefix`).
 *        it survives a prime fault through the one leaf the lane meet composes too
 *        (`withPrimeFaultSurvived`), so one policy and one stderr sentence serve both primes.
 *        behind a name, so the orchestrator reads "prime, then pour"
 *        (rule.forbid.decode-friction-in-orchestrators)
 * .note = 🔴 a survived fault is RETURNED, never dropped: a prime that timed out after the
 *         provider billed it spent real money, so the lane's cost must read unknown rather
 *         than a sum that omits it (`0.wish`: never under-report)
 * .note = `set`, never `get`: it makes a billed prime poke and writes its run to disk, the
 *         peer of `setOneReviewPrefixPrime` and `setOneReviewLanePrime`
 *         (rule.require.get-set-gen-verbs)
 */
export const setOneReviewPartitionsPrime = async (
  input: { review: StepReviewInput; common: string[] },
  options: { runOne: ReviewPartitionRunStep },
): Promise<{
  primed: StepReviewResult | null;
  faults: { error: unknown }[];
}> => {
  // no shared prefix, no prime
  if (input.common.length === 0) return { primed: null, faults: [] };

  // run the prime; survive only a prime fault
  const prime = await withPrimeFaultSurvived({
    operation: () =>
      options.runOne({
        ...input.review,
        output: asReviewPartitionOutputPath({
          output: input.review.output,
          of: 'prime',
        }),
        partition: asReviewPartitionOfPrime({ common: input.common }),
        // a prime reviews naught, so it names no peers; the note trails the target, past the prefix
        peers: [],
        prime: true,
      }),
    peers: 'partitions',
  });
  if (!prime.settled) return { primed: null, faults: [prime.fault] };
  return { primed: prime.value, faults: [] };
};
