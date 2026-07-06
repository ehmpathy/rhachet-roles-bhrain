import * as fs from 'fs/promises';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';

import { enumRouteGuardReviewPeerFiles } from './enumRouteGuardReviewPeerFiles';
import { getDurationMsFromContent } from './getDurationMsFromContent';
import { getExitCodeClass } from './getExitCodeClass';
import { getReviewCountsFromContent } from './getReviewCountsFromContent';

/**
 * .what = finds the latest review artifact for a specific reviewer index, regardless of hash
 * .why = when a reviewer is exhausted, we need their latest review even if hash changed
 *
 * .note = filename format: $stone._.review.i$iteration.$hash.r$index._.given.by_peer.$slug.md
 *         finds all reviews for this index, returns highest iteration
 */
export const getLatestReviewArtifactForIndex = async (input: {
  stone: RouteStone;
  index: number;
  route: string;
}): Promise<RouteStoneGuardReviewArtifact | null> => {
  // find all reviews for this reviewer index
  const reviewFiles = await enumRouteGuardReviewPeerFiles({
    route: input.route,
    stone: input.stone.name,
    index: input.index,
  });

  if (reviewFiles.length === 0) return null;

  // find the file with highest iteration
  let latestFile: string | null = null;
  let latestIteration = -1;

  for (const filePath of reviewFiles) {
    const filename = path.basename(filePath);
    // parse iteration from filename
    const iterMatch = filename.match(/\.i(\d+)\./);

    // iteration is required - file matched our glob, must have iteration marker
    if (!iterMatch?.[1])
      UnexpectedCodePathError.throw(
        'review file lacks iteration marker in filename. ' +
          'expected format: $stone._.review.i$iter.$hash.r$n._.given.by_peer.$slug.md. ' +
          'fix: delete the malformed file and re-run the guard',
        { filename, filePath },
      );
    const iteration = parseInt(iterMatch[1], 10);

    if (iteration > latestIteration) {
      latestIteration = iteration;
      latestFile = filePath;
    }
  }

  if (!latestFile) return null;

  // parse the review file
  const content = await fs.readFile(latestFile, 'utf-8');
  const filename = path.basename(latestFile);

  // extract hash from filename
  // format: .i$iter.$hash.r$n._.given...
  const hashMatch = filename.match(/\.i\d+\.([a-f0-9]+)\.r\d+\./);

  // hash is required - file matched our glob, must have hash
  if (!hashMatch?.[1])
    UnexpectedCodePathError.throw(
      'review file lacks hash in filename. ' +
        'expected format: $stone._.review.i$iter.$hash.r$n._.given.by_peer.$slug.md. ' +
        'fix: delete the malformed file and re-run the guard',
      {
        filename,
        filePath: latestFile,
      },
    );
  const hash = hashMatch[1];

  // parse blockers and nitpicks from stdout
  const counts = getReviewCountsFromContent({ content });

  // parse duration from content via shared operation
  const durationMs = getDurationMsFromContent({ content });

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
