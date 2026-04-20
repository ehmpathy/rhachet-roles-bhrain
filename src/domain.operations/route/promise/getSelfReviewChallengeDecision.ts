import * as fs from 'fs/promises';
import * as path from 'path';

import { findsertSelfReviewGitignore } from '../gitignore/findsertSelfReviewGitignore';
import { getSelfReviewArticulationPath } from '../guard/getSelfReviewArticulationPath';
import { getSelfReviewTriggeredCount } from './getSelfReviewTriggeredCount';
import { getSelfReviewTriggeredReport } from './getSelfReviewTriggeredReport';
import { setSelfReviewTriggeredReport } from './setSelfReviewTriggeredReport';

/**
 * .what = decide if promise should be allowed, challenged first, challenged rushed, or challenged absent
 * .why = encapsulates trigger lookup, file presence check, time enforcement, hashbar threshold, rush detection, plowthrough, and report creation
 *
 * .note = order matters:
 *   1. challenge:first when no prior report (introduces concept, shows path)
 *   2. challenge:absent when file absent (holds accountable after they know about it)
 *   3. challenge:rushed when too soon
 *   4. allowed when time passed
 *
 * .note = plowthrough: if attempts >= 3 on same hash, allow without timer
 * .note = hashbar controls timer behavior on hash change:
 *   - before hashbar: each hash change resets 30s timer
 *   - after hashbar: timer persists (any triggered file > 30s allows promise)
 *
 * .note = rush detection:
 *   - challenge:first when .uptil absent (first promise attempt after trigger)
 *   - challenge:rushed when .uptil exists (re-attempt)
 */
export const getSelfReviewChallengeDecision = async (input: {
  stone: string;
  slug: string;
  hash: string;
  route: string;
  index: number;
  hashbar?: number;
}): Promise<{
  decision:
    | 'allowed'
    | 'challenge:first'
    | 'challenge:rushed'
    | 'challenge:absent';
  articulationPath?: string;
}> => {
  // compute articulation path (used for challenge:absent and formatters)
  // note: index is 1-based so files sort in order of review (1.slug, 2.slug, etc.)
  const articulationPath = getSelfReviewArticulationPath({
    route: input.route,
    stone: input.stone,
    index: input.index,
    slug: input.slug,
  });

  // default hashbar to 1
  const hashbar = input.hashbar ?? 1;
  const threshold = 30 * 1000;
  const plowthroughThreshold = 3;

  // lookup trigger report for this hash
  const report = await getSelfReviewTriggeredReport(input);

  // no report = first challenge, start timer now (introduces concept before file check)
  if (!report) {
    // ensure review/self/.gitignore found or created before driver writes
    await findsertSelfReviewGitignore({ route: input.route });
    await setSelfReviewTriggeredReport(input);
    return { decision: 'challenge:first', articulationPath };
  }

  // check articulation file presence (only after they've seen challenge:first)
  const fileExists = await fs
    .access(articulationPath)
    .then(() => true)
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return false;
      throw error;
    });
  if (!fileExists) {
    return { decision: 'challenge:absent', articulationPath };
  }

  // check for rush BEFORE update: .uptil exists = re-attempt
  // note: .since is created by setStoneAsPassed, .uptil is created here on first promise attempt
  const baseFilename = `${input.stone}.guard.selfreview.${input.slug}.${input.hash}.triggered`;
  const uptilPath = path.join(input.route, '.route', `${baseFilename}.uptil`);
  const uptilExisted = await fs
    .access(uptilPath)
    .then(() => true)
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return false;
      throw error;
    });
  const isRush = uptilExisted;

  // update .uptil mtime and increment attempts (creates if absent, updates if present)
  const { attempts } = await setSelfReviewTriggeredReport(input);

  // check plowthrough (attempts >= 3 on same hash)
  if (attempts >= plowthroughThreshold) {
    return { decision: 'allowed' };
  }

  // check hashbar threshold (count across all hashes for this slug)
  const { count, newest } = await getSelfReviewTriggeredCount({
    stone: input.stone,
    slug: input.slug,
    route: input.route,
  });

  // if count > hashbar → check newest mtime (hash change no longer resets timer)
  if (count > hashbar && newest) {
    const elapsed = Date.now() - newest.sinceMtime.getTime();
    if (elapsed >= threshold) {
      return { decision: 'allowed' };
    }
    // still need to wait
    return { decision: isRush ? 'challenge:rushed' : 'challenge:first' };
  }

  // before hashbar → check this hash's mtime (hash change resets timer)
  const elapsed = Date.now() - report.sinceMtime.getTime();
  if (elapsed < threshold) {
    return { decision: isRush ? 'challenge:rushed' : 'challenge:first' };
  }

  return { decision: 'allowed' };
};
