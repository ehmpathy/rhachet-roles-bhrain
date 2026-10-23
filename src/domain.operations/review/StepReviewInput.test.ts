import { given, then, when } from 'test-fns';

import type { ReviewPartitionOfTargets } from './partition/getAllTargetsByPartition';
import type { StepReviewInputOfRun } from './StepReviewInput';

/**
 * .what = a type clamp: the internal run role admits a prime only beside its partition
 * .why = a prime with no partition would send the whole lane as a one-token poke — a
 *        full-price prefill that reviews naught. the union must refuse it at compile time
 */
describe('StepReviewInputOfRun', () => {
  const partition: ReviewPartitionOfTargets = {
    name: 'src',
    globs: ['src/**'],
    common: [],
    narrow: ['src/a.ts'],
    commonGraded: [],
  };

  given('[case1] the three legal run roles', () => {
    when('[t0] each is written', () => {
      then('a whole lane, a partition, and a prime each compile', () => {
        const roles: StepReviewInputOfRun[] = [
          {},
          { partition, peers: [{ name: 'test', globs: ['test/**'] }] },
          { partition, peers: [], prime: true },
        ];
        expect(roles).toHaveLength(3);
      });
    });
  });

  given('[case2] 🔴 a prime with no partition', () => {
    when('[t0] it is written', () => {
      then('it does not compile', () => {
        // @ts-expect-error — a prime exists only beside the partition it primes
        const role: StepReviewInputOfRun = { prime: true };
        expect(role.prime).toEqual(true);
      });
    });
  });
});
