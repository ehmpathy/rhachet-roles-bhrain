import { asTermsHookReachLeaves } from './asTermsHookReachLeaves';

const TEST_CASES: {
  description: string;
  layout: 'split' | 'old';
  expected: string[];
}[] = [
  {
    description:
      'the split layout reaches enrolled sessions, never plain claude',
    layout: 'split',
    expected: [
      '   ├─ reaches = sessions enrolled via rhx enroll that hold the learner',
      '   ├─ plain claude = not reached; with .claude split per actor, it reads no repo settings',
    ],
  },
  {
    description: 'the old layout reaches every session in the repo',
    layout: 'old',
    expected: [
      '   ├─ reaches = every claude session in this repo, while the learner is linked',
    ],
  },
];

describe('asTermsHookReachLeaves', () => {
  TEST_CASES.forEach((thisCase) => {
    test(thisCase.description, () => {
      expect(asTermsHookReachLeaves({ layout: thisCase.layout })).toEqual(
        thisCase.expected,
      );
    });
  });
});
