/**
 * .what = extracts thresholds from the guard's reviewed? judge command
 * .why = enables per-reviewer verdict with same thresholds as aggregate judge
 */
export const getReviewedJudgeThresholds = (input: {
  judges: string[];
}): { allowBlockers: number; allowNitpicks: number } | null => {
  // find the reviewed? judge command
  const reviewedJudge = input.judges.find(
    (cmd) =>
      cmd.includes('--mechanism reviewed?') || cmd.includes('--type reviewed?'),
  );

  if (!reviewedJudge) return null;

  // parse --allow-blockers N (default 0)
  const blockersMatch = reviewedJudge.match(/--allow-blockers\s+(\d+)/);
  const allowBlockers = blockersMatch ? parseInt(blockersMatch[1]!, 10) : 0;

  // parse --allow-nitpicks N (default 0)
  const nitpicksMatch = reviewedJudge.match(/--allow-nitpicks\s+(\d+)/);
  const allowNitpicks = nitpicksMatch ? parseInt(nitpicksMatch[1]!, 10) : 0;

  return { allowBlockers, allowNitpicks };
};
