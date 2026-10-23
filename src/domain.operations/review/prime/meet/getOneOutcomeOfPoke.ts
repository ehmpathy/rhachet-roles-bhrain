import { asReviewPrimeFaultLine } from '@src/domain.operations/review/prime/asReviewPrimeFaultLine';
import type { ReviewPrefixPrimeOutcome } from '@src/domain.operations/review/prime/ReviewPrefixPrimeOutcome';
import { withPrimeFaultSurvived } from '@src/domain.operations/review/prime/withPrimeFaultSurvived';
import { ReviewTimeoutError } from '@src/domain.operations/review/ReviewTimeoutError';
import { withDeadline } from '@src/domain.operations/review/withDeadline';

import { getOneMsLeftOfMeet } from './getOneMsLeftOfMeet';

/**
 * .what = the outcome of the leader's poke: `primed`, `faulted` where it hit a prime fault or
 *         outlasted what the lane's deadline left the meet, or `lapsed` where none was left
 * .why = 🔴 the poke has a wedge bound of its own, far longer than a short review bound. so the
 *        leader waits on it no longer than the meet may spend; past that, the lane stops to
 *        wait, releases its claim cold, and its review departs inside its bound. a prime is an
 *        optimization, never a gate (rule.forbid.cold-pour-of-a-shared-prefix)
 *
 * .note = the race reuses `withDeadline`, whose timer clears the moment the poke settles. a
 *         `ReviewTimeoutError` can reach the catch only from that timer: a fault inside the
 *         poke is caught first by `withPrimeFaultSurvived`
 * .note = a race abandons the wait, never the work: a poke still in flight at the deadline
 *         runs on, and its spend lands in its own run dir as any poke's does
 */
export const getOneOutcomeOfPoke = async (input: {
  prime: () => Promise<unknown>;
  deadline: { msOfStop: number };
}): Promise<ReviewPrefixPrimeOutcome> => {
  // no time left to poke: the lane pours cold, with no poke sent
  const msOfWait = getOneMsLeftOfMeet(input.deadline);
  if (msOfWait <= 0) return 'lapsed';

  // poke within what the deadline left; survive only a prime fault, or the deadline
  return withDeadline({
    timeoutMs: msOfWait,
    operation: async () => {
      const poked = await withPrimeFaultSurvived({
        operation: input.prime,
        peers: 'lanes',
      });
      return poked.settled ? ('primed' as const) : ('faulted' as const);
    },
  }).catch((error: unknown) => {
    if (!(error instanceof ReviewTimeoutError)) throw error;
    console.error(asReviewPrimeFaultLine({ kind: 'deadline', msOfWait }));
    return 'faulted' as const;
  });
};
