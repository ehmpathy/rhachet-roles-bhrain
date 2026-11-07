import type { BrainChoice, ContextBrain } from 'rhachet';
import type { Artifact } from 'rhachet-artifact';
import type { GitFile } from 'rhachet-artifact-git';

import type { ReviewLaneClock } from '@src/domain.objects/Reviewer/ReviewLaneClock';
import type { ReviewRunArgsRecord } from '@src/domain.objects/Reviewer/ReviewRunArgsRecord';
import type { ReviewRunMeet } from '@src/domain.objects/Reviewer/ReviewRunMeet';
import type { ReviewRunMetricsExpected } from '@src/domain.objects/Reviewer/ReviewRunMetricsExpected';
import { asReviewPrefixPrimeKey } from '@src/domain.operations/review/prime/asReviewPrefixPrimeKey';
import { genReviewPrefixPrime } from '@src/domain.operations/review/prime/genReviewPrefixPrime';
import { getOneReviewPrimeMeetStopMs } from '@src/domain.operations/review/prime/getOneReviewPrimeMeetStopMs';
import { getOneReviewRunMeet } from '@src/domain.operations/review/prime/getOneReviewRunMeet';
import { setOneReviewLanePrime } from '@src/domain.operations/review/prime/setOneReviewLanePrime';
import { withSpinner } from '@src/domain.operations/withSpinner';

/**
 * .what = meets the peers of a lane's pour on the prime watermark, and names what it did
 * .why = the guard pours a level's lanes as separate processes ~62ms apart, so lanes that
 *        share a head all arrive cold (rule.forbid.cold-pour-of-a-shared-prefix). they meet
 *        on one watermark, keyed by brain + head; one poke goes first, then all pour.
 *        one operation owns the guards, the key, the deadline, the spinner, and the poke, so
 *        the review step reads it as one line
 *
 * .note = a partition run skips it: its split lane already primed its common prefix. a lone
 *         run skips it too: only a lane its caller marked to join (a lane the guard spawned,
 *         read once at the cli boundary) has peers to meet
 * .note = 🔴 bounded by the lane's own deadline: every wait in it stops at half the brain
 *         call bound, so the brain call keeps the other half, and an optimization can never
 *         time out the review it serves (`getOneReviewPrimeMeetStopMs`)
 * .note = the spinner shows only where the run's stdout reaches a terminal. the guard runs
 *         its lanes progress-silent (`runOneReview`), so there the wait shows naught, and
 *         no record holds its seconds yet
 */
export const genReviewRunMeet = async (
  input: {
    /** whether this run is one partition of a split lane */
    partition: boolean;
    /** whether the caller marked this lane to join its pour's meet */
    join: boolean;
    /** the head every lane of the meet sends, and the artifact this run holds it in */
    head: { text: string; brief: Artifact<typeof GitFile> };
    /** this run's args record, which a poke's own record is cast from */
    args: ReviewRunArgsRecord;
    metricsExpected: ReviewRunMetricsExpected;
    cwd: string;
    clock: ReviewLaneClock;
  },
  context: { brain: ContextBrain<BrainChoice> },
): Promise<ReviewRunMeet> =>
  await getOneReviewRunMeet({
    partition: input.partition,
    join: input.join,
    meet: () =>
      withSpinner({
        message:
          '⏳ the lanes of this pour meet, so one warms the head for all',
        operation: () =>
          genReviewPrefixPrime(
            {
              cwd: input.cwd,
              key: asReviewPrefixPrimeKey({
                brain: context.brain.brain.choice.slug,
                head: input.head.text,
              }),
              deadline: {
                msOfStop: getOneReviewPrimeMeetStopMs({
                  msOfReviewStart: input.clock.msOfReviewStart,
                  brainCallTimeoutMs: input.clock.brainCallTimeoutMs,
                }),
              },
            },
            {
              prime: () =>
                setOneReviewLanePrime(
                  {
                    headBrief: input.head.brief,
                    cwd: input.cwd,
                    args: input.args,
                    metricsExpected: input.metricsExpected,
                  },
                  context,
                ),
            },
          ),
      }),
  });
