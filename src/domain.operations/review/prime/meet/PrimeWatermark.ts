/**
 * .what = the watermark of one head's meet: a claim not yet released, or a released claim
 *
 * - `claimedBy` / `claimedAt` = the lane that took the head, and when
 * - `primedBy` / `primedAt`   = the claim that released, and when; null while unreleased
 * - `warm`                    = whether the release asserts the head is in cache. only a
 *                               poke that settled asserts it: the poke's prefill wrote the
 *                               head before the release. a solo release and a faulted poke
 *                               release the claim with NO such fact behind them, so they
 *                               write `false` and no peer reads the head as warm
 * - `sent`                    = whether the holder's own review departs at the release, and
 *                               so carries the head to the provider. true wherever the leader
 *                               settled (primed, solo, lapsed, or a faulted poke); false where
 *                               its prime threw a defect, since no review of its own follows
 * - `peers`                   = the lanes that registered against the current claim
 *
 * .note = every instant is epoch milliseconds (`Date.now()`), since the record is compared
 *         across processes by subtraction alone and is never rendered for a human. a record
 *         goes stale in minutes (`MS_OF_STALE_DEFAULT`), so no reader must parse an older shape
 * .note = the two variants are apart so a reader narrows on `primedAt` by type, never by `!`
 */
export type PrimeWatermark = PrimeWatermarkClaimed | PrimeWatermarkReleased;

/**
 * .what = a claim that no release has followed yet
 */
export interface PrimeWatermarkClaimed {
  claimedBy: string;
  claimedAt: number;
  primedBy: null;
  primedAt: null;
  warm: false;
  sent: false;
  peers: string[];
}

/**
 * .what = a claim its holder has released, with what that release asserts
 */
export interface PrimeWatermarkReleased {
  claimedBy: string;
  claimedAt: number;
  primedBy: string;
  primedAt: number;
  warm: boolean;
  sent: boolean;
  peers: string[];
}
