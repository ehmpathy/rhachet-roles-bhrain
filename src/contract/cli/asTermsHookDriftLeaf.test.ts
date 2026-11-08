import { asTermsHookDriftLeaf } from './asTermsHookDriftLeaf';

const LEARNER = 'repo=bhrain/role=learner';
const TOGGLE = 'toggle=learn.terms.hook/role=learner';

const TEST_CASES: {
  description: string;
  authors: string[];
  expected: string;
}[] = [
  {
    description:
      'one entry reads as an entry, with the full repair command and its author',
    authors: [LEARNER],
    expected: [
      '   ├─ drift = an entry to replace or remove, via rhx learn.terms.hook enable',
      `   │  └─ by ${LEARNER}`,
    ].join('\n'),
  },
  {
    description:
      'more than one reads as their count, each author once, an absent one in words',
    authors: [LEARNER, TOGGLE, '(no author)'],
    expected: [
      '   ├─ drift = 3 entries to replace or remove, via rhx learn.terms.hook enable',
      `   │  ├─ by ${LEARNER}`,
      `   │  ├─ by ${TOGGLE}`,
      '   │  └─ with no author',
    ].join('\n'),
  },
];

describe('asTermsHookDriftLeaf', () => {
  TEST_CASES.forEach((thisCase) => {
    test(thisCase.description, () => {
      expect(asTermsHookDriftLeaf({ authors: thisCase.authors })).toEqual(
        thisCase.expected,
      );
    });
  });
});
