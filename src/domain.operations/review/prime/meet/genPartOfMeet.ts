import { withReviewWatermarkHold } from '@src/domain.operations/review/watermark/withReviewWatermarkHold';

import { asPartOfMeet, type PartOfMeet } from './asPartOfMeet';
import { getOnePrimeWatermark } from './getOnePrimeWatermark';
import { setOnePrimeWatermark } from './setOnePrimeWatermark';

/**
 * .what = finds this lane's part in the meet, or creates it: a peer registers against the
 *         live claim, a leader takes the head
 * .why = the read-check-write runs under one short hold, so two lanes that arrive at once
 *        cannot both see no claim and both lead — exactly one leader per head
 */
export const genPartOfMeet = async (input: {
  meet: { cwd: string; key: string };
  nonce: string;
  ms: { await: number; stale: number; reach: number };
}): Promise<PartOfMeet> =>
  withReviewWatermarkHold(input.meet, async () => {
    // decide the part from the watermark as found
    const msOfNow = Date.now();
    const found = await getOnePrimeWatermark({ meet: input.meet });
    const part = asPartOfMeet({ found, msOfNow, ms: input.ms });

    // a peer registers against the claim it waits on
    if (part.role === 'peer' && found !== null)
      await setOnePrimeWatermark({
        meet: input.meet,
        watermark: { ...found, peers: [...found.peers, input.nonce] },
      });

    // a leader takes the head afresh
    if (part.role === 'leader')
      await setOnePrimeWatermark({
        meet: input.meet,
        watermark: {
          claimedBy: input.nonce,
          claimedAt: msOfNow,
          primedBy: null,
          primedAt: null,
          warm: false,
          sent: false,
          peers: [],
        },
      });

    return part;
  });
