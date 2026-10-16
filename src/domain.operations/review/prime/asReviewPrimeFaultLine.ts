/**
 * .what = the one stderr line a prime emits when its peers pour cold for a fault
 * .why = each fault sentence has one home, so the meet and the partition pour read as "name the
 *        fault, pour cold" around a named call rather than an inline template
 *        (rule.prefer.decomposable-architecture). a change to a sentence lands here alone
 *
 * - `store`    = the meet watermark could not be read or written; this lane pours cold
 * - `release`  = the claim's release could not be written; its peers pour cold at their deadline
 * - `poke`     = the poke of the shared prefix hit a prime fault; its peers pour cold. `peers`
 *                names who pours: the peer lanes of a meet, or the partitions of a split lane
 * - `deadline` = the poke outlasted the share of the lane's bound the meet may spend; the lane
 *                stops to wait on it, and its peers pour cold
 * - `timeout`  = the claim was not released within the await bound; this lane pours cold
 *
 * .note = all five open `💥 MalfunctionError:`, since in each the system, never the caller,
 *         must act: a primer that never released (slow or dead) is the system's to clear,
 *         the same as a watermark it could not write (rule.require.qualified-error-headers)
 */
export const asReviewPrimeFaultLine = (
  input:
    | { kind: 'store'; cause: string }
    | { kind: 'release'; cause: string }
    | { kind: 'poke'; cause: string; peers: 'lanes' | 'partitions' }
    | { kind: 'deadline'; msOfWait: number }
    | { kind: 'timeout'; msOfAwait: number },
): string => {
  if (input.kind === 'store')
    return `💥 MalfunctionError: the prime watermark could not be read or written (${input.cause}); this lane pours cold`;
  if (input.kind === 'release')
    return `💥 MalfunctionError: the prime release could not be written (${input.cause}); its peer lanes pour cold at their deadline`;
  if (input.kind === 'poke')
    return `💥 MalfunctionError: the prime of the shared prefix failed (${input.cause}); its peer ${input.peers} pour cold`;
  if (input.kind === 'deadline')
    return `💥 MalfunctionError: the prime of the shared prefix outlasted the ${input.msOfWait}ms this lane's deadline left the meet; its peer lanes pour cold`;
  return `💥 MalfunctionError: the prime of the shared head was not released within ${input.msOfAwait}ms; this lane pours cold`;
};
