import * as fs from 'fs/promises';

import { getReviewCountsViaRegex } from './getReviewCountsViaRegex';

/**
 * .what = computes total blockers and nitpicks from review files
 * .why = aggregates counts across multiple review files for threshold check
 */
export const computeReviewTotalsFromFiles = async (input: {
  reviewFiles: string[];
}): Promise<{ totalBlockers: number; totalNitpicks: number }> => {
  let totalBlockers = 0;
  let totalNitpicks = 0;

  for (const filePath of input.reviewFiles) {
    const content = await fs.readFile(filePath, 'utf-8');
    const counts = getReviewCountsViaRegex({ content });
    // undetected reviews contribute 0 — preserves the prior `?? 0` behavior for absent counts
    if (!counts.detected) continue;
    totalBlockers += counts.blockers;
    totalNitpicks += counts.nitpicks;
  }

  return { totalBlockers, totalNitpicks };
};
