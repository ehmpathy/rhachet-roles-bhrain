import { getSelfReviewTriggeredReport } from './getSelfReviewTriggeredReport';
import { setSelfReviewTriggeredReport } from './setSelfReviewTriggeredReport';

/**
 * .what = decide if promise should be allowed or challenged
 * .why = encapsulates trigger lookup, time enforcement, and report creation
 */
export const getSelfReviewChallengeDecision = async (input: {
  stone: string;
  slug: string;
  hash: string;
  route: string;
}): Promise<{ decision: 'allowed' } | { decision: 'challenged' }> => {
  // lookup trigger report
  const report = await getSelfReviewTriggeredReport(input);

  // no report = challenged, start timer now
  if (!report) {
    await setSelfReviewTriggeredReport(input);
    return { decision: 'challenged' };
  }

  // enforce 90 second minimum
  const elapsed = Date.now() - report.mtime.getTime();
  const threshold = 90 * 1000;

  if (elapsed < threshold) {
    return { decision: 'challenged' };
  }

  return { decision: 'allowed' };
};
