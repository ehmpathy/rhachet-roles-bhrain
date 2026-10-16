import { withReviewWatermarkHold } from '@src/domain.operations/review/watermark/withReviewWatermarkHold';

import { getOnePrimeWatermark } from './getOnePrimeWatermark';
import { setOnePrimeWatermark } from './setOnePrimeWatermark';

/**
 * .what = writes the release of this lane's claim, under a short hold
 * .why = only the claim's own holder may release it; a claim another lane took over
 *        after this one was judged abandoned is left alone. `warm` records whether a settled
 *        poke stands behind the release; `sent` records whether the holder's own review
 *        departs now, and so carries the head to the provider
 */
export const setReleaseOfClaim = async (input: {
  meet: { cwd: string; key: string };
  holder: string;
  warm: boolean;
  sent: boolean;
}): Promise<void> =>
  withReviewWatermarkHold(input.meet, async () => {
    const found = await getOnePrimeWatermark({ meet: input.meet });
    if (found === null || found.claimedBy !== input.holder) return;
    await setOnePrimeWatermark({
      meet: input.meet,
      watermark: {
        ...found,
        primedBy: input.holder,
        primedAt: Date.now(),
        warm: input.warm,
        sent: input.sent,
      },
    });
  });
