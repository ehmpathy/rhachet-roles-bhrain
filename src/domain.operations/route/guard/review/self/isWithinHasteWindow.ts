/**
 * .what = decides whether a promise lands inside the haste window of its ask
 * .why = the cue's whole condition was inline at its one call site as a date subtraction
 *        beside a boolean conjunction — two shapes a reader must simulate to learn what
 *        the gate actually asks (rule.forbid.inline-decode-friction)
 *
 * .note = 🔴 `firstAdjudication` is the caller's ATOMIC claim, never a counter read.
 *         see setSelfReviewTriggeredReport for why the two are not interchangeable:
 *         the claim is exactly-once by construction, the counter is not.
 *
 * .note = 🔴 `askedAt` is NON-NULL by precondition, and the type is what enforces it.
 *         the caller returns `challenge:unasked` before it reaches here, so an absent ask
 *         cannot arrive. a nullable signature would say the opposite — that the gate has
 *         a defined answer with no ask on record — and that is the shape the unasked
 *         verdict exists to refuse.
 *
 * 🔴 .note = the WALL-CLOCK assumption, and its one failure DIRECTION, stated rather than
 *            implied (`rule.forbid.time-assumptions` asks that a time assumption carry its
 *            rationale). `Date.now()` and the ask's mtime are both wall clock, so a backward
 *            jump between the two — an ntp correction, a vm resume, a manual set — makes
 *            `now - askedAt` negative, and a negative is always `< windowMs`.
 *
 *            ⇒ **the cue INFLATES under a backward jump and never shrinks.** a driver who
 *            genuinely read for an hour would be confronted once. that is the safe direction
 *            of the two, and it is why this is documented rather than guarded:
 *
 *            | the skew | what the driver meets | the cost |
 *            |---|---|---|
 *            | clock jumps BACK | one confrontation they did not earn | one command, no wait |
 *            | clock jumps FORWARD | the cue is skipped | the cue was a message, never a gate |
 *
 *            a monotonic clock would fix it and cannot be used: the ask is an mtime on disk,
 *            so the two operands must share a time base, and the file system's is wall clock.
 *            ⚠️ should this ever become a GATE rather than a cue, the direction stops to be
 *            benign and the operand must move off mtime first.
 *
 *            .found = `arch-hazards-behavior` at i014 (nitpick.2), re-raised at i015
 */
export const isWithinHasteWindow = (input: {
  firstAdjudication: boolean;
  askedAt: Date;
  windowMs: number;
}): boolean => {
  if (!input.firstAdjudication) return false;
  return Date.now() - input.askedAt.getTime() < input.windowMs;
};
