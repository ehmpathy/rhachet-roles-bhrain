import { computeReviewPeerVerdict } from './meter/computeReviewPeerVerdict';

/**
 * .what = does this given's verdict clear the allowance, so the lane raises no hold?
 * .why = TWO gates ask it — `assertAbsorptionHasSubject` (R2, to refuse a stance with no subject)
 *        and `computeUndeclaredConcerns` (to skip a lane that owes no declaration). both must
 *        key on the VERDICT rather than a raw blocker count (F012 / S06), and both were
 *        written inline with the same sentinel pair and the same comment above it, word for
 *        word.
 *
 * 🔴 the sentinel is the part that must land once. `computeReviewPeerVerdict` returns `queued`
 *    when `rounds === 0`, and neither caller asks about rounds at all — so both pass `1` to
 *    keep `queued` off the table. that is a **contract detail of the verdict operation**, not
 *    of either gate, and a change to it would otherwise have to be found in two places by a
 *    reader who knew to look.
 *
 * ⚠️ and the two gates take OPPOSITE actions on the same answer — one skips, one throws. so a
 *    drift between the copies would not read as an inconsistency; it would read as two gates
 *    that legitimately disagree, which is the shape that survives a review.
 *
 * .note = it takes the counts rather than the given, so a caller with a projection need not
 *         hold a whole `RouteGuardReviewPeerGiven` to ask (rule.prefer.most-common-denominator).
 */
export const isGivenVerdictApproved = (input: {
  blockers: number;
  nitpicks: number;
  allowBlockers: number;
  allowNitpicks: number;
}): boolean =>
  computeReviewPeerVerdict({
    // rounds/budget are not this question — it asks only whether the LATEST given holds the
    // road, so a nonzero rounds keeps `queued` off the table
    rounds: 1,
    budget: 1,
    blockers: input.blockers,
    nitpicks: input.nitpicks,
    allowBlockers: input.allowBlockers,
    allowNitpicks: input.allowNitpicks,
  }) === 'approved';
