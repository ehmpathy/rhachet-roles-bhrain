/**
 * .what = how one lane's meet settled
 *
 * - `primed`   = this lane held the claim, found a peer, and sent the poke
 * - `faulted`  = this lane held the claim, found a peer, and the poke failed or outlasted the
 *                lane's deadline — or the watermark store faulted, so this lane pours cold
 * - `solo`     = this lane held the claim and found no peer; no poke was sent
 * - `awaited`  = the head is warm: a peer held the claim and released it warm, or a recent
 *                release is warm, or a recent cold release's holder sent its own review and
 *                this lane let that review reach the provider (`msOfReach`) before it poured
 * - `cold`     = a peer held the claim and released it with no prime behind it (it found no
 *                peer in its gather, or its poke faulted); this lane pours cold at once
 * - `timeout`  = a peer held the claim and never released it in time — within the await bound,
 *                or within what the lane's deadline left the meet
 * - `lapsed`   = the lane's deadline left the meet no time; this lane took no claim (or stopped
 *                before its poke) and pours cold at once
 *
 * .why = its own file, so the meet's leaves can name it without an import of their orchestrator
 */
export type ReviewPrefixPrimeOutcome =
  | 'primed'
  | 'faulted'
  | 'solo'
  | 'awaited'
  | 'cold'
  | 'timeout'
  | 'lapsed';
