/**
 * .what = sums a set of review verdicts into the stone-wide blocker + nitpick tally
 * .why = names the fold, so the totals reader reads as gather → sum, with no inline reduce
 *        to simulate (rule.forbid.decode-friction-in-orchestrators)
 */
export const computeReviewTotals = (input: {
  verdicts: { blockers: number; nitpicks: number }[];
}): { totalBlockers: number; totalNitpicks: number } => ({
  totalBlockers: input.verdicts.reduce(
    (sum, verdict) => sum + verdict.blockers,
    0,
  ),
  totalNitpicks: input.verdicts.reduce(
    (sum, verdict) => sum + verdict.nitpicks,
    0,
  ),
});
