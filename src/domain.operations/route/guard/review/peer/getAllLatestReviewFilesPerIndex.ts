import * as path from 'path';

import { asGuardArtifactIteration } from '../../artifact/asGuardArtifactIteration';
import { asReviewIndexFromPath } from './asReviewIndexFromPath';
import { isLaterByIterationThenPath } from './isLaterByIterationThenPath';

/**
 * .what = groups review files by index, keeps only latest iteration per index
 * .why = review artifacts are versioned via iteration (i$N); latest supersedes earlier
 *
 * .note = filename format: $stone._.review.i$iteration.$hash.r$index._.given.by_peer.$slug.md
 *         later iterations represent re-runs after fix
 */
export const getAllLatestReviewFilesPerIndex = (input: {
  reviewFiles: string[];
}): string[] => {
  // group by review index, keep only latest iteration per index
  // .note = deliberate mutation of a scoped local accumulator. the map is allocated here and
  //         never escapes — only its paths do, copied into a fresh sorted array — and a
  //         group-by is what a map is for (rule.require.immutable-vars)
  const latestByIndex = new Map<number, { iteration: number; path: string }>();

  for (const filePath of input.reviewFiles) {
    // parse iteration and index from filename, each via the named parser that owns it
    // .note = format: $stone._.review.i$iteration.$hash.r$index._.given.by_peer.$slug.md
    const iteration =
      asGuardArtifactIteration({ filename: path.basename(filePath) }) ?? 0;
    const index = asReviewIndexFromPath({ path: filePath });
    const candidate = { iteration, path: filePath };

    // keep the max over the total order (iteration, then path), so a tie is order-free
    const incumbent = latestByIndex.get(index) ?? null;
    if (isLaterByIterationThenPath({ candidate, incumbent }))
      latestByIndex.set(index, candidate);
  }

  // sort by index for deterministic order
  return [...latestByIndex.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v.path);
};
