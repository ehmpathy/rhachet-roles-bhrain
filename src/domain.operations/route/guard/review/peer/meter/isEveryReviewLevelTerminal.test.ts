import type { ReviewPeerVerdict } from './computeReviewPeerVerdict';
import { isEveryReviewLevelTerminal } from './isEveryReviewLevelTerminal';

/**
 * .what = unit cases for isEveryReviewLevelTerminal (a pure, overrule-aware terminality predicate).
 * .why = this predicate gates the exhaustion halt and the exhaustion+approval bypass. its whole
 *        reason to exist is that an overruled level's RAW verdict stays 'rejected', so it must be
 *        counted terminal via the overrule flag, not the verdict. the B5 case (overruled l1 +
 *        exhausted l3 => true) is the one a bare verdict-check gets wrong.
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
  };
  expect: boolean;
}> = [
  {
    description: 'no reviewers → false (an empty ladder is not "all terminal")',
    given: { reviewers: [], overruledLevels: new Set() },
    expect: false,
  },
  {
    description: 'single approved level → true',
    given: {
      reviewers: [reviewer({ level: 1, verdict: 'approved' })],
      overruledLevels: new Set(),
    },
    expect: true,
  },
  {
    description: 'single rejected level (non-terminal) → false',
    given: {
      reviewers: [reviewer({ level: 1, verdict: 'rejected' })],
      overruledLevels: new Set(),
    },
    expect: false,
  },
  {
    description: 'single exhausted level → true (exhausted is terminal)',
    given: {
      reviewers: [reviewer({ level: 1, verdict: 'exhausted' })],
      overruledLevels: new Set(),
    },
    expect: true,
  },
  {
    description:
      'l1 rejected + l3 exhausted, NO overrule → false (l1 non-terminal)',
    given: {
      reviewers: [
        reviewer({ level: 1, verdict: 'rejected' }),
        reviewer({ level: 3, verdict: 'exhausted' }),
      ],
      overruledLevels: new Set(),
    },
    expect: false,
  },
  {
    description:
      'B5 CORE: l1 rejected + l3 exhausted, l1 OVERRULED → true (overrule makes l1 terminal)',
    given: {
      reviewers: [
        reviewer({ level: 1, verdict: 'rejected' }),
        reviewer({ level: 3, verdict: 'exhausted' }),
      ],
      overruledLevels: new Set([1]),
    },
    expect: true,
  },
  {
    description:
      'l1 queued + l3 exhausted, l1 overruled → true (overrule covers a never-run l1)',
    given: {
      reviewers: [
        reviewer({ level: 1, verdict: 'queued' }),
        reviewer({ level: 3, verdict: 'exhausted' }),
      ],
      overruledLevels: new Set([1]),
    },
    expect: true,
  },
  {
    description:
      'l1 approved + l3 queued (non-terminal, not overruled) → false',
    given: {
      reviewers: [
        reviewer({ level: 1, verdict: 'approved' }),
        reviewer({ level: 3, verdict: 'queued' }),
      ],
      overruledLevels: new Set(),
    },
    expect: false,
  },
  {
    description:
      'l1 rejected (NOT overruled) + l3 exhausted, only l3 overruled → false (l1 still non-terminal)',
    given: {
      reviewers: [
        reviewer({ level: 1, verdict: 'rejected' }),
        reviewer({ level: 3, verdict: 'exhausted' }),
      ],
      overruledLevels: new Set([3]),
    },
    expect: false,
  },
];

describe('isEveryReviewLevelTerminal', () => {
  CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const result = isEveryReviewLevelTerminal({
        reviewers: thisCase.given.reviewers,
        overruledLevels: thisCase.given.overruledLevels,
      });
      expect(result).toEqual(thisCase.expect);
    }),
  );
});
