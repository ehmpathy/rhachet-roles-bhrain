/**
 * .what = the one number a rewind reports for "triggers cleared", summed from its two marker kinds
 * .why = the sum was inline arithmetic inside a template literal in `rewindAffectedStones`, so a
 *        reader had to decode that the displayed total is two distinct marker kinds added together
 *        (`rule.require.named-transformers`).
 *
 * 🔴 .why the two kinds sum at all, and why `cleared` is the honest verb = they are cleared by
 *    two DIFFERENT acts and the driver is told one number:
 *
 *    | kind | what the rewind does to it |
 *    |---|---|
 *    | `selfReviews` — the `.since` / `.uptil` pair | **archived** |
 *    | `blocked` — the blocked-state marker | **deleted** |
 *
 *    ⇒ `cleared` is true of a delete and of an archive alike, which is what lets one word carry
 *    both. a line that said *removed* would be false of the archived half.
 *
 * 🟡 .why its OWN operation rather than a local const = it is a pure transformer, so
 *    `rule.require.test-coverage-by-grain` asks for a unit test with no route, no stone, and no
 *    filesystem. it is deliberately NOT a reuse argument — one call site today
 *    (`rule.prefer.wet-over-dry`) — it is the narrative and testability argument, which needs no
 *    usage count.
 *
 * .found = `mech-decode-friction` at i015, nitpick.1 — its first pass since i003
 */
export const asClearedTriggerTotal = (input: {
  /** the self-review trigger markers the rewind archived */
  selfReviews: number;
  /** the blocked-state markers the rewind deleted */
  blocked: number;
}): number => input.selfReviews + input.blocked;
