import type { ReviewPeerVerdict } from './computeReviewPeerVerdict';

/**
 * .what = checks if a single verdict is exhausted
 * .why = single source of truth for exhausted verdict check
 */
export const isReviewPeerVerdictExhausted = (
  verdict: ReviewPeerVerdict,
): boolean => verdict === 'exhausted';
