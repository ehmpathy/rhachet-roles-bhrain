import type { ReviewLane } from '@src/domain.operations/review/asReviewLane';
import { isSameReviewer } from '@src/domain.operations/review/isSameReviewer';

const laneBase: ReviewLane = {
  root: '/repo/.log/bhrain/review',
  slug: 'repo-rules',
  head: 'head-a',
  brain: 'test/brain',
};

const TEST_CASES: {
  description: string;
  given: { a: ReviewLane | null; b: ReviewLane | null };
  expect: boolean;
}[] = [
  {
    description: 'one root and one slug is one reviewer',
    given: { a: laneBase, b: { ...laneBase } },
    expect: true,
  },
  {
    description: '🔴 a new head is a new lane of the SAME reviewer',
    given: { a: laneBase, b: { ...laneBase, head: 'head-b' } },
    expect: true,
  },
  {
    description: 'a new brain is a new lane of the same reviewer',
    given: { a: laneBase, b: { ...laneBase, brain: 'test/other' } },
    expect: true,
  },
  {
    description: 'another slug is another reviewer',
    given: { a: laneBase, b: { ...laneBase, slug: 'mech-failhides' } },
    expect: false,
  },
  {
    description: 'another root is another reviewer, though the slug matches',
    given: {
      a: laneBase,
      b: { ...laneBase, root: '/other/.log/bhrain/review' },
    },
    expect: false,
  },
  {
    description: 'a run with no lane belongs to no reviewer',
    given: { a: null, b: laneBase },
    expect: false,
  },
  {
    description: 'two runs with no lane do not pair by accident',
    given: { a: null, b: null },
    expect: false,
  },
];

describe('isSameReviewer', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isSameReviewer(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
