import * as fs from 'fs/promises';

import { getReviewCountsFromContent } from './getReviewCountsFromContent';

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
    const counts = getReviewCountsFromContent({ content });
    totalBlockers += counts.blockers;
    totalNitpicks += counts.nitpicks;
  }

  return { totalBlockers, totalNitpicks };
};
