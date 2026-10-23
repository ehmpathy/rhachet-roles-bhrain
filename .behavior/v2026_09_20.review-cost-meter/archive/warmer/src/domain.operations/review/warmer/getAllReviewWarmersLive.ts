import { isErrorOfWatermarkFault } from '@src/domain.operations/review/watermark/isErrorOfWatermarkFault';

import { getOneReviewWarmerLive } from './getOneReviewWarmerLive';
import type {
  ReviewWarmerPrefix,
  ReviewWarmerRecord,
} from './ReviewWarmerRecord';

/**
 * .what = every warmer still awake among a set of reviewer lanes, one per lane, sorted by
 *         reviewer
 * .why = a detached warmer bills until its plan is spent, and the round that spawned it
 *        printed its pid once. a driver who reads the bill after that output scrolled away
 *        needs the live set read back from the watermarks, never a paid review re-run
 *
 * .note = a lane whose watermark the store refuses is left out rather than fail the read:
 *         the list is an aside to a cost report, and the report must still print
 */
export const getAllReviewWarmersLive = async (input: {
  cwd: string;
  reviewers: string[];
  now: Date;
}): Promise<
  {
    reviewer: string;
    record: ReviewWarmerRecord;
    prefix: ReviewWarmerPrefix;
  }[]
> => {
  // one read per distinct lane, in a stable order
  const reviewers = [...new Set(input.reviewers)].sort();
  const lives = await Promise.all(
    reviewers.map(async (reviewer) => {
      const live = await getOneReviewWarmerLive({
        cwd: input.cwd,
        reviewer,
        now: input.now,
      }).catch((error: unknown) => {
        if (!isErrorOfWatermarkFault({ error })) throw error;
        return null;
      });
      return live === null ? [] : [{ reviewer, ...live }];
    }),
  );
  return lives.flat();
};
