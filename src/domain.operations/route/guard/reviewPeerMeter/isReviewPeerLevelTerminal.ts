import type { ReviewPeerVerdict } from './computeReviewPeerVerdict';

/**
 * .what = checks if a single verdict is exhausted
 * .why = single source of truth for exhausted verdict check
 */
export const isReviewPeerVerdictExhausted = (
  verdict: ReviewPeerVerdict,
): boolean => verdict === 'exhausted';

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

/**
 * .what = checks if all reviewers at a level are terminal
 * .why = determines if higher levels can be unlocked
 */
export const isReviewPeerLevelTerminal = (input: {
  reviewers: Array<{ level: number; verdict: ReviewPeerVerdict }>;
  level: number;
}): boolean => {
  // find all reviewers at this level
  const atLevel = input.reviewers.filter((r) => r.level === input.level);

  // empty level is considered terminal (no reviewers to wait for)
  if (atLevel.length === 0) return true;

  // check if all are terminal
  return atLevel.every((r) => isReviewPeerVerdictTerminal(r.verdict));
};
