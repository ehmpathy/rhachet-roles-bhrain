import { getSelfReviewTriggeredCount } from './getSelfReviewTriggeredCount';
import { getSelfReviewTriggeredReport } from './getSelfReviewTriggeredReport';
import { setSelfReviewTriggeredReport } from './setSelfReviewTriggeredReport';

/**
 * .what = decide if promise should be allowed or challenged
 * .why = encapsulates trigger lookup, time enforcement, hashbar threshold, and report creation
 *
 * .note = hashbar controls timer behavior on hash change:
 *   - before hashbar: each hash change resets 30s timer
 *   - after hashbar: timer persists (any triggered file > 30s allows promise)
 */
export const getSelfReviewChallengeDecision = async (input: {
  stone: string;
  slug: string;
  hash: string;
  route: string;
  hashbar?: number;
}): Promise<{ decision: 'allowed' } | { decision: 'challenged' }> => {
  // default hashbar to 1
  const hashbar = input.hashbar ?? 1;
  const threshold = 30 * 1000;

  // lookup trigger report for this hash
  const report = await getSelfReviewTriggeredReport(input);

  // no report = challenged, start timer now
  if (!report) {
    await setSelfReviewTriggeredReport(input);
    return { decision: 'challenged' };
  }

  // check hashbar threshold (count across all hashes for this slug)
  const { count, newestMtime } = await getSelfReviewTriggeredCount({
    stone: input.stone,
    slug: input.slug,
    route: input.route,
  });

  // if count > hashbar → check newest mtime (hash change no longer resets timer)
  if (count > hashbar && newestMtime) {
    const elapsed = Date.now() - newestMtime.getTime();
    if (elapsed >= threshold) {
      return { decision: 'allowed' };
    }
    // still need to wait
    return { decision: 'challenged' };
  }

  // before hashbar → check this hash's mtime (hash change resets timer)
  const elapsed = Date.now() - report.mtime.getTime();
  if (elapsed < threshold) {
    return { decision: 'challenged' };
  }

  return { decision: 'allowed' };
};
