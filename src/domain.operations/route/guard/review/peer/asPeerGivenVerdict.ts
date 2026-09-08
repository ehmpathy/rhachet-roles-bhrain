import type { ReviewCounts } from '../getReviewCountsViaRegex';

/**
 * .what = the verdict an UNREADABLE given carries — one blocker, zero nitpicks
 * .why = an absent verdict is not a clean verdict. contract.reviewer-output states it flatly:
 *        "if it finds no numeric count it can NOT assume zero. a silent 0/0 would look like a
 *        clean approval when in truth no verdict was seen." so the unreadable case must gate.
 *
 * .note = the count is 1 rather than a larger number because the gate reads `blockers > 0` and
 *         never the magnitude — one is the smallest value that carries the full sense
 */
const VERDICT_UNREADABLE = { blockers: 1, nitpicks: 0, unreadable: true };

/**
 * .what = casts a parsed ReviewCounts into the {blockers, nitpicks} pair the gate compares on
 * .why = ReviewCounts is a discriminated union built so a caller CANNOT read a fake 0/0 out of
 *        an absent verdict (rule.forbid.failhide, enforced at the type). that protection is only
 *        as good as the cast that leaves it, so the cast lives here, named and unit-clamped,
 *        rather than as a ternary inline in a communicator where it reads as a formality.
 *
 * .note = 🔴 an unreadable given GATES, and that is dischargeable — never a deadlock. the taken
 *         path is derived from the given path by one infix swap (getRouteGuardReviewPeerPathTaken),
 *         and the halt prompt names it, so a driver answers an unreadable given exactly as it
 *         answers a readable one. the reviewer is the party that malfunctioned; the driver is
 *         still the party that must say so.
 */
export const asPeerGivenVerdict = (input: {
  counts: ReviewCounts;
}): { blockers: number; nitpicks: number; unreadable: boolean } => {
  // an absent verdict gates — it is a malfunction to name, not a clean bill to grant
  if (!input.counts.detected) return VERDICT_UNREADABLE;

  return {
    blockers: input.counts.blockers,
    nitpicks: input.counts.nitpicks,
    // 🔴 the flag rides WITH the count, never beside it. the count for an unreadable
    //    given is FABRICATED — the gate needs a number and no number was read — so a
    //    surface that prints it as though it were the reviewer's words re-hides the
    //    malfunction the union exists to surface (r9 nitpick.1, i003)
    unreadable: false,
  };
};
