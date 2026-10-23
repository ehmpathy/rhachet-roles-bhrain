import { sleep } from 'iso-time';

import { asReviewPrimeFaultLine } from '@src/domain.operations/review/prime/asReviewPrimeFaultLine';
import type { ReviewPrefixPrimeOutcome } from '@src/domain.operations/review/prime/ReviewPrefixPrimeOutcome';
import { asWatermarkFaultOrThrow } from '@src/domain.operations/review/watermark/asWatermarkFaultOrThrow';

import { getOneMsLeftOfMeet } from './getOneMsLeftOfMeet';
import { getOnePrimeWatermark } from './getOnePrimeWatermark';

/**
 * .what = waits for the release of the claim this lane registered against
 * .why = the wait reads the watermark with no hold — it changes only once, when the primer
 *        releases — and is bounded twice: by the await bound, and by what the lane's deadline
 *        left the meet. so a primer that crashed or wedged costs a cold pour inside the
 *        review's bound, never a hang and never a timed-out review
 *        (rule.forbid.cold-pour-of-a-shared-prefix)
 */
export const getOneReleaseOfHolder = async (input: {
  meet: { cwd: string; key: string };
  holder: string;
  ms: { await: number; poll: number };
  deadline: { msOfStop: number };
}): Promise<ReviewPrefixPrimeOutcome> => {
  // the wait this lane may spend: the await bound, or less where the deadline is nearer
  const msOfWait = Math.min(input.ms.await, getOneMsLeftOfMeet(input.deadline));
  const msOfGiveUp = Date.now() + msOfWait;
  while (Date.now() < msOfGiveUp) {
    // a store fault reads as no release yet; the give-up instant still bounds the wait
    const found = await getOnePrimeWatermark({ meet: input.meet }).catch(
      asWatermarkFaultOrThrow,
    );
    const isReleased =
      found !== null && !('fault' in found) && found.primedBy === input.holder;
    if (isReleased) return found.warm === true ? 'awaited' : 'cold';
    await sleep({
      milliseconds: Math.min(
        input.ms.poll,
        Math.max(0, msOfGiveUp - Date.now()),
      ),
    });
  }
  console.error(
    asReviewPrimeFaultLine({ kind: 'timeout', msOfAwait: msOfWait }),
  );
  return 'timeout';
};
