import * as fs from 'fs/promises';
import * as path from 'path';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

import { getExitCodeClass } from './getExitCodeClass';
import { getReviewCountsFromContent } from './getReviewCountsFromContent';

/**
 * .what = finds the latest review artifact for a specific reviewer index, regardless of hash
 * .why = when a reviewer is exhausted, we need their latest review even if hash changed
 *
 * .note = filename format: $stone.guard.review.i$iteration.$hash.r$index.md
 *         finds all reviews for this index, returns highest iteration
 */
export const getLatestReviewArtifactForIndex = async (input: {
  stone: RouteStone;
  index: number;
  route: string;
}): Promise<RouteStoneGuardReviewArtifact | null> => {
  const routeDir = path.join(input.route, '.route');

  // check if .route dir found
  try {
    await fs.access(routeDir);
  } catch {
    return null;
  }

  // glob for all review files that match this index (any hash, any iteration)
  // pattern: $stone.guard.review.i*.*.r$index.md
  const reviewGlob = `${input.stone.name}.guard.review.*.r${input.index}.md`;
  const reviewFiles = await enumFilesFromGlob({
    glob: reviewGlob,
    cwd: routeDir,
  });

  if (reviewFiles.length === 0) return null;

  // find the file with highest iteration
  let latestFile: string | null = null;
  let latestIteration = -1;

  for (const filePath of reviewFiles) {
    const filename = path.basename(filePath);
    // parse iteration from filename: $stone.guard.review.i$iter.$hash.r$index.md
    const iterMatch = filename.match(/\.i(\d+)\./);
    const iteration = iterMatch?.[1] ? parseInt(iterMatch[1], 10) : 0;

    if (iteration > latestIteration) {
      latestIteration = iteration;
      latestFile = filePath;
    }
  }

  if (!latestFile) return null;

  // parse the review file
  const content = await fs.readFile(latestFile, 'utf-8');
  const filename = path.basename(latestFile);

  // extract hash from filename: $stone.guard.review.i$iter.$hash.r$index.md
  // the hash is between the iteration and the index
  const hashMatch = filename.match(/\.i\d+\.([a-f0-9]+)\.r\d+\.md$/);
  const hash = hashMatch?.[1] ?? '';

  // parse blockers and nitpicks from stdout
  const counts = getReviewCountsFromContent({ content });

  // parse duration from content
  const durationMatch = content.match(/total:\s*(\d+)ms/i);
  const durationMs = durationMatch?.[1] ? parseInt(durationMatch[1], 10) : null;

  // parse exit code from tree bucket format
  const exitCodeMatch = content.match(/exit code:\s*(\d+)/);
  const exitCode = exitCodeMatch?.[1] ? parseInt(exitCodeMatch[1], 10) : 0;
  const exitClass = getExitCodeClass({ code: exitCode });

  // extract stdout/stderr from tree buckets (simplified - just use content as stdout)
  // .note = for exhausted review display, we mainly need blockers/nitpicks/path
  const stdout = content;
  const stderr = '';

  return new RouteStoneGuardReviewArtifact({
    stone: { path: input.stone.path },
    hash,
    iteration: latestIteration,
    index: input.index,
    path: latestFile,
    blockers: counts.blockers,
    nitpicks: counts.nitpicks,
    exitCode,
    exitClass,
    stdout,
    stderr,
    durationMs,
  });
};
