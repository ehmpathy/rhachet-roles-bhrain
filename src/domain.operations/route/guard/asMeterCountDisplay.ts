/**
 * .what = renders a meter count (rounds or budget) for display — non-finite as '∞', else the number
 * .why = an unlimited budget is stored as `Infinity`, and `String(Infinity)` reads as the literal
 *        'Infinity' to a driver. every meter-render surface owes the same '∞' substitution, so one
 *        transformer single-sources it rather than a fourth ad-hoc copy
 *        (rule.forbid.duplicate-format-tree-operations, rule.prefer.wet-over-dry at 4 usages).
 *
 * .note = the paired guard on the stance ack's tail (formatRouteGuardReviewPeerAbsorptionAck's
 *         asReviewerMeterLine) tests `!Number.isFinite(count)`, which covers `Infinity` PLUS
 *         `-Infinity` and `NaN`. an `=== Infinity` check here left those two extreme values to
 *         fall through to `String(count)` — so one line could read '∞ rounds left' from the tail
 *         and 'NaN' from the count cell for the same value (r009 nitpick.2, i005). `!isFinite`
 *         matches the pair exactly, so the cell and the tail agree on every extreme.
 */
export const asMeterCountDisplay = (count: number): string =>
  Number.isFinite(count) ? String(count) : '∞';
