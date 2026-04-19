/**
 * .what = computes whether review totals pass threshold checks
 * .why = extracts threshold comparison logic for narrative flow
 */
export const computeReviewThresholdVerdict = (input: {
  totalBlockers: number;
  totalNitpicks: number;
  allowBlockers: number;
  allowNitpicks: number;
}): {
  passed: boolean;
  reason: string;
} => {
  // check blockers threshold
  if (input.totalBlockers > input.allowBlockers) {
    return {
      passed: false,
      reason: `blockers exceed threshold (${input.totalBlockers} > ${input.allowBlockers})`,
    };
  }

  // check nitpicks threshold
  if (input.totalNitpicks > input.allowNitpicks) {
    return {
      passed: false,
      reason: `nitpicks exceed threshold (${input.totalNitpicks} > ${input.allowNitpicks})`,
    };
  }

  // all thresholds pass
  return {
    passed: true,
    reason: `reviews pass (blockers: ${input.totalBlockers}/${input.allowBlockers}, nitpicks: ${input.totalNitpicks}/${input.allowNitpicks})`,
  };
};
