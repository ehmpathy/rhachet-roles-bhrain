import { asJudgeReasonBranches } from './asJudgeReasonBranches';
import { asJudgeReasonWithShed } from './asJudgeReasonWithShed';

const TEST_CASES = [
  {
    description: 'a reason with no shed is all head, with no branches',
    given: {
      reason: 'blockers exceed threshold (2 > 0)',
      disputed: { blockers: 0, nitpicks: 0 },
      concededBetter: { blockers: 0, nitpicks: 0 },
    },
    expect: { head: 'blockers exceed threshold (2 > 0)', shed: [] },
  },
  {
    description: 'a hold with one axis shed nests that axis as one branch',
    given: {
      reason: 'blockers exceed threshold (2 > 0)',
      disputed: { blockers: 0, nitpicks: 0 },
      concededBetter: { blockers: 1, nitpicks: 0 },
    },
    expect: {
      head: 'blockers exceed threshold (2 > 0)',
      shed: ['after 1 blocker shed (0 disputed + 1 conceded better)'],
    },
  },
  {
    description:
      'a pass with both axes shed nests one branch per axis, and keeps the verdict parens whole',
    given: {
      reason: 'reviews pass (blockers: 0/0, nitpicks: 0/7)',
      disputed: { blockers: 0, nitpicks: 1 },
      concededBetter: { blockers: 3, nitpicks: 0 },
    },
    expect: {
      head: 'reviews pass (blockers: 0/0, nitpicks: 0/7)',
      shed: [
        'after 3 blockers shed (0 disputed + 3 conceded better)',
        'after 1 nitpick shed (1 disputed + 0 conceded better)',
      ],
    },
  },
];

describe('asJudgeReasonBranches', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      // round trip from the one writer, so the split can never drift from the write
      const reason = asJudgeReasonWithShed(thisCase.given);
      expect(asJudgeReasonBranches({ reason })).toEqual(thisCase.expect);
    }),
  );
});
