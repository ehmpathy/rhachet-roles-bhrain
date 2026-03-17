import * as path from 'path';

/**
 * .what = groups review files by index, keeps only latest iteration per index
 * .why = review artifacts are versioned via iteration (i$N); latest supersedes earlier
 *
 * .note = filename format: $stone.guard.review.i$iteration.$hash.r$index.md
 *         later iterations represent re-runs after fix
 */
export const getLatestReviewFilesPerIndex = (input: {
  reviewFiles: string[];
}): string[] => {
  // group by review index, keep only latest iteration per index
  const latestByIndex = new Map<number, { iteration: number; path: string }>();

  for (const filePath of input.reviewFiles) {
    // parse iteration and index from filename
    const iterMatch = path.basename(filePath).match(/\.i(\d+)\./);
    const indexMatch = path.basename(filePath).match(/\.r(\d+)\.md$/);
    const iteration = iterMatch?.[1] ? parseInt(iterMatch[1], 10) : 0;
    const index = indexMatch?.[1] ? parseInt(indexMatch[1], 10) : 0;

    const extant = latestByIndex.get(index);
    if (!extant || iteration > extant.iteration) {
      latestByIndex.set(index, { iteration, path: filePath });
    }
  }

  // sort by index for deterministic order
  return [...latestByIndex.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v.path);
};
