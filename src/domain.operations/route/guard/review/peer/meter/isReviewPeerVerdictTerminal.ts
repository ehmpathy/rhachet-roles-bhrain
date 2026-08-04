import type { ReviewPeerVerdict } from './computeReviewPeerVerdict';
import { isReviewPeerVerdictExhausted } from './isReviewPeerVerdictExhausted';

/**
 * .what = checks if a single verdict is terminal
 * .why = single source of truth for terminal verdict definition
 *
 * terminal verdicts: approved | exhausted | malfunction | constraint
 *
 * .note = malfunction and constraint are terminal because:
 *   - a broken/constrained reviewer cannot proceed without external intervention
 *   - broken reviewers should not block tier escalation (l2/l3 can run)
 *   - human can overrule if needed
 */
export const isReviewPeerVerdictTerminal = (
  verdict: ReviewPeerVerdict,
): boolean =>
  verdict === 'approved' ||
  verdict === 'malfunction' ||
  verdict === 'constraint' ||
  isReviewPeerVerdictExhausted(verdict);
