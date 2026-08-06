import type { ReviewPeerVerdict } from '../review/peer/meter/computeReviewPeerVerdict';
import { computeStoneGuardExhaustedApprovalBypass } from './computeStoneGuardExhaustedApprovalBypass';

/**
 * .what = unit cases for computeStoneGuardExhaustedApprovalBypass (the pure bypass decision core).
 * .why = the bypass grants passage ONLY when all three meet: every level terminal (overrule-aware),
 *        at least one reviewer exhausted, and a human approval present. any one absent → no bypass.
 *        these cases pin that branch matrix so a future edit cannot quietly widen the bypass — the
 *        exact skeleton-key class this behavior exists to close.
 */

const reviewer = (input: {
  level: number;
  verdict: ReviewPeerVerdict;
}): { level: number; verdict: ReviewPeerVerdict } => input;

const CASES: Array<{
  description: string;
  given: {
    reviewers: Array<{ level: number; verdict: ReviewPeerVerdict }>;
    overruledLevels: Set<number>;
    approvalPresent: boolean;
  };
  expect: boolean;
}> = [
  {
    description:
      'all-terminal + exhausted + approved → true (the one legitimate bypass)',
    given: {
      reviewers: [reviewer({ level: 1, verdict: 'exhausted' })],
      overruledLevels: new Set(),
      approvalPresent: true,
    },
    expect: true,
  },
  {
    description:
      'all-terminal + exhausted + NO approval → false (human sign-off is required)',
    given: {
      reviewers: [reviewer({ level: 1, verdict: 'exhausted' })],
      overruledLevels: new Set(),
      approvalPresent: false,
    },
    expect: false,
  },
  {
    description:
      'NOT all-terminal (a rejected level) + exhausted + approved → false',
    given: {
      reviewers: [
        reviewer({ level: 1, verdict: 'rejected' }),
        reviewer({ level: 3, verdict: 'exhausted' }),
      ],
      overruledLevels: new Set(),
      approvalPresent: true,
    },
    expect: false,
  },
  {
    description:
      'all-terminal but NO exhausted reviewer (all approved) + approved → false',
    given: {
      reviewers: [reviewer({ level: 1, verdict: 'approved' })],
      overruledLevels: new Set(),
      approvalPresent: true,
    },
    expect: false,
  },
  {
    description:
      'B5: l1 overruled (rejected raw) + l3 exhausted + approved → true (overrule makes l1 terminal)',
    given: {
      reviewers: [
        reviewer({ level: 1, verdict: 'rejected' }),
        reviewer({ level: 3, verdict: 'exhausted' }),
      ],
      overruledLevels: new Set([1]),
      approvalPresent: true,
    },
    expect: true,
  },
  {
    description:
      'B5 shape but NO approval: l1 overruled + l3 exhausted + no approval → false',
    given: {
      reviewers: [
        reviewer({ level: 1, verdict: 'rejected' }),
        reviewer({ level: 3, verdict: 'exhausted' }),
      ],
      overruledLevels: new Set([1]),
      approvalPresent: false,
    },
    expect: false,
  },
  {
    description: 'no reviewers → false (an empty ladder is not all-terminal)',
    given: {
      reviewers: [],
      overruledLevels: new Set(),
      approvalPresent: true,
    },
    expect: false,
  },
];

describe('computeStoneGuardExhaustedApprovalBypass', () => {
  CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const result = computeStoneGuardExhaustedApprovalBypass({
        reviewers: thisCase.given.reviewers,
        overruledLevels: thisCase.given.overruledLevels,
        approvalPresent: thisCase.given.approvalPresent,
      });
      expect(result).toEqual(thisCase.expect);
    }),
  );
});
