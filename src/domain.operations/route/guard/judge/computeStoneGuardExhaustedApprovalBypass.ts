import type { ReviewPeerVerdict } from '../review/peer/meter/computeReviewPeerVerdict';
import { isEveryReviewLevelTerminal } from '../review/peer/meter/isEveryReviewLevelTerminal';
import { isReviewPeerVerdictExhausted } from '../review/peer/meter/isReviewPeerVerdictExhausted';

/**
 * .what = pure decision core: does the exhausted-reviewer + human-approval bypass apply?
 * .why = the reviewed? judge grants passage on a stone whose reviewers are spent when a human has
 *        signed off — "once they approve for either, they approve for both" (per wish). the bypass
 *        holds when ALL THREE meet: every review level is terminal (overrule-aware), at least one
 *        reviewer is exhausted, and a human approval is present. any one absent → no bypass.
 *
 *        kept pure (decision from already-loaded data) so its branch matrix is unit-testable without
 *        the filesystem — the `getStoneGuardExhaustedApprovalBypass` wrapper does the fs reads, this
 *        core does the decision (the same pure/impure split as
 *        computeStoneGuardOverruleTarget / getStoneGuardOverruleTarget).
 */
export const computeStoneGuardExhaustedApprovalBypass = (input: {
  reviewers: Array<{ level: number; verdict: ReviewPeerVerdict }>;
  overruledLevels: Set<number>;
  approvalPresent: boolean;
}): boolean => {
  // every level terminal (an overruled level counts as terminal)
  const allTerminal = isEveryReviewLevelTerminal({
    reviewers: input.reviewers,
    overruledLevels: input.overruledLevels,
  });

  // at least one reviewer spent to exhaustion (else there is no exhaustion to forgive)
  const anyExhausted = input.reviewers.some((r) =>
    isReviewPeerVerdictExhausted(r.verdict),
  );

  // the bypass needs all three: terminal ladder, an exhausted reviewer, and a human approval
  return allTerminal && anyExhausted && input.approvalPresent;
};
