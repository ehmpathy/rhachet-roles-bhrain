import { isPrimeWatermarkReleased } from './isPrimeWatermarkReleased';
import type { PrimeWatermark } from './PrimeWatermark';

/**
 * .what = a lane's part in the meet
 *
 * - `leader` = no live claim: this lane takes the head
 * - `peer`   = a fresh claim not yet released: this lane waits on its holder
 * - `warm`   = a recent release asserts the head is in cache: this lane pours at once
 * - `trail`  = a recent cold release whose holder sent its own review: this lane waits out
 *              what remains of `reach`, then pours against the head that review carried
 */
export type PartOfMeet =
  | { role: 'leader' }
  | { role: 'peer'; holder: string }
  | { role: 'warm' }
  | { role: 'trail'; msOfRemainder: number };

/**
 * .what = decides a lane's part in the meet from the watermark it found
 * .why = the decision is pure, so it reads apart from the hold that writes its consequence,
 *        and each branch is checkable with no store at all
 *
 * .note = instants are epoch milliseconds, as the watermark records them (`PrimeWatermark`)
 * .note = 🔴 a release reads warm only where it SAYS warm. a release that lacks the field
 *         asserts no cache, so a lane that read it as warm would pour against a prefix no
 *         request filled (rule.forbid.undefined-attributes: no legacy reads)
 */
export const asPartOfMeet = (input: {
  found: PrimeWatermark | null;
  msOfNow: number;
  ms: { await: number; stale: number; reach: number };
}): PartOfMeet => {
  const { found, msOfNow, ms } = input;

  // a recent WARM release of the current claim: the head is in cache, no wait owed
  const isReleased = isPrimeWatermarkReleased(found);
  const isRecent = isReleased && msOfNow - found.primedAt < ms.stale;
  if (isRecent && found.warm === true) return { role: 'warm' };

  // a recent COLD release whose holder sent its own review (solo, lapsed, or a faulted poke):
  // that review carries the head, so trail it — pour once it has had `reach` to land
  if (isRecent && found.sent === true)
    return {
      role: 'trail',
      msOfRemainder: Math.max(0, found.primedAt + ms.reach - msOfNow),
    };

  // a fresh claim not yet released: register as its peer
  if (found !== null && !isReleased && msOfNow - found.claimedAt < ms.await)
    return { role: 'peer', holder: found.claimedBy };

  // no claim, a stale release, an unsent cold release, or an abandoned claim: take the head
  return { role: 'leader' };
};
