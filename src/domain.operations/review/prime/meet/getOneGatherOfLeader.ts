import { withReviewWatermarkHold } from '@src/domain.operations/review/watermark/withReviewWatermarkHold';

import { getOnePrimeWatermark } from './getOnePrimeWatermark';
import { setOnePrimeWatermark } from './setOnePrimeWatermark';

/**
 * .what = closes the leader's gather: `peers` where a peer registered, else `solo` — and a
 *         solo close releases the claim in the same hold
 * .why = the read of the peer list and the solo release must be one transition. were they
 *        two, a lane that arrived between them would register as a peer of a leader that had
 *        already chosen solo, and read its release as cold. in one hold, a lane that arrives
 *        before the close is a peer (so the leader pokes), and one that arrives after finds a
 *        sent release and trails it
 */
export const getOneGatherOfLeader = async (input: {
  meet: { cwd: string; key: string };
  nonce: string;
}): Promise<'peers' | 'solo'> =>
  withReviewWatermarkHold(input.meet, async () => {
    const found = await getOnePrimeWatermark({ meet: input.meet });
    const isHolder = found !== null && found.claimedBy === input.nonce;
    if (isHolder && found.peers.length > 0) return 'peers' as const;

    // no peer: release now, cold, with this lane's own review about to depart
    if (isHolder)
      await setOnePrimeWatermark({
        meet: input.meet,
        watermark: {
          ...found,
          primedBy: input.nonce,
          primedAt: Date.now(),
          warm: false,
          sent: true,
        },
      });
    return 'solo' as const;
  });
