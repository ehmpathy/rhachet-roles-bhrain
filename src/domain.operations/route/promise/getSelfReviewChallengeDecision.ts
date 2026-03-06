import * as fs from 'fs/promises';
import * as path from 'path';

import { getSelfReviewTriggeredCount } from './getSelfReviewTriggeredCount';
import { getSelfReviewTriggeredReport } from './getSelfReviewTriggeredReport';
import { setSelfReviewTriggeredReport } from './setSelfReviewTriggeredReport';

/**
 * .what = decide if promise should be allowed, challenged first, or challenged rushed
 * .why = encapsulates trigger lookup, time enforcement, hashbar threshold, rush detection, plowthrough, and report creation
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
  hashbar?: number;
}): Promise<{
  decision: 'allowed' | 'challenge:first' | 'challenge:rushed';
}> => {
  // default hashbar to 1
  const hashbar = input.hashbar ?? 1;
  const threshold = 30 * 1000;
  const plowthroughThreshold = 3;

  // lookup trigger report for this hash
  const report = await getSelfReviewTriggeredReport(input);

  // no report = first challenge, start timer now
  if (!report) {
    await setSelfReviewTriggeredReport(input);
    return { decision: 'challenge:first' };
  }

  // check for rush BEFORE update: .uptil exists = re-attempt
  // note: .since is created by setStoneAsPassed, .uptil is created here on first promise attempt
  const baseFilename = `${input.stone}.guard.selfreview.${input.slug}.${input.hash}.triggered`;
  const uptilPath = path.join(input.route, '.route', `${baseFilename}.uptil`);
  const uptilExisted = await fs
    .access(uptilPath)
    .then(() => true)
    .catch(() => false);
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
