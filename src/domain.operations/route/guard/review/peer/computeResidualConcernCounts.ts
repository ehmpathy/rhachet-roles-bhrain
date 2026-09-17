/**
 * .what = the concern counts that REMAIN once the SHED ones are subtracted, clamped at zero
 * .why = a stance sheds a concern from a tally at the grain of ONE concern (S07), so the judge,
 *        the per-round skip, and the per-lane meter all sum the same way: total minus shed, never
 *        below zero. that clamp-at-zero arithmetic drifted across call sites, so it is
 *        single-sourced here (rule.prefer.decomposable-architecture, rule-of-three).
 *
 * .note = the SHED set differs by caller, so this op takes the count rather than the predicate.
 *         the per-lane skip sheds DISPUTES only; the `reviewed?` judge sheds disputes AND
 *         `better`-conceded concerns (S16). each caller sums its own shed set and passes it here.
 *
 * 🔴 the clamp carries real weight, never cosmetic: a stale stance must never manufacture headroom
 *    the tally did not have. `Math.max(0, …)` is the one line that keeps a subtracted count honest.
 */
export const computeResidualConcernCounts = (input: {
  totalBlockers: number;
  totalNitpicks: number;
  shedBlockers: number;
  shedNitpicks: number;
}): { blockers: number; nitpicks: number } => ({
  blockers: Math.max(0, input.totalBlockers - input.shedBlockers),
  nitpicks: Math.max(0, input.totalNitpicks - input.shedNitpicks),
});
