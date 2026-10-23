import { asErrorHeadline } from '@src/domain.operations/review/asErrorHeadline';
import { isErrorOfPrimeFault } from '@src/domain.operations/review/prime/poke/isErrorOfPrimeFault';

import { asReviewPrimeFaultLine } from './asReviewPrimeFaultLine';

/**
 * .what = runs one prime and survives only a prime fault: the prime's value where it settled,
 *         else the fault it survived, named on stderr
 * .why = the prime is an optimization, never a gate (`rule.forbid.cold-pour-of-a-shared-prefix`):
 *        a prime FAULT (`isErrorOfPrimeFault`) costs the cache, never the review, so its peers
 *        pour cold. a defect in our own code rethrows (rule.forbid.failhide). both primes — the
 *        lane meet's poke and a split lane's common-prefix run — compose this one leaf, so the
 *        survival policy and its stderr line have one home each
 *
 * .note = the survived fault is RETURNED, never dropped: a prime that faulted after the
 *         provider billed it spent real money, and a caller that meters spend must weigh it
 *         (`0.wish`: never under-report)
 */
export const withPrimeFaultSurvived = async <T>(input: {
  operation: () => Promise<T>;
  peers: 'lanes' | 'partitions';
}): Promise<
  { settled: true; value: T } | { settled: false; fault: { error: unknown } }
> =>
  input.operation().then(
    (value) => ({ settled: true as const, value }),
    (error: unknown) => {
      // a defect in our own code fails loud; only a prime fault is survived
      if (!isErrorOfPrimeFault({ error })) throw error;

      // a prime fault costs the cache, never the review
      console.error(
        asReviewPrimeFaultLine({
          kind: 'poke',
          cause: asErrorHeadline({ error }),
          peers: input.peers,
        }),
      );
      return { settled: false as const, fault: { error } };
    },
  );
