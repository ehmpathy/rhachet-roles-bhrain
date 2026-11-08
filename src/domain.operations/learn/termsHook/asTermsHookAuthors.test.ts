import { asTermsHookAuthors } from './asTermsHookAuthors';

const TEST_CASES: {
  description: string;
  given: Parameters<typeof asTermsHookAuthors>[0];
  expect: string[];
}[] = [
  { description: 'no hooks', given: { hooks: [] }, expect: [] },
  {
    description: 'each author, in order',
    given: {
      hooks: [
        { command: 'x', author: 'repo=bhrain/role=learner' },
        { command: 'x', author: 'toggle=learn.terms.hook/role=learner' },
      ],
    },
    expect: [
      'repo=bhrain/role=learner',
      'toggle=learn.terms.hook/role=learner',
    ],
  },
  {
    description: 'a hook with no author reads as (no author)',
    given: { hooks: [{ command: 'x' }] },
    expect: ['(no author)'],
  },
];

describe('asTermsHookAuthors', () => {
  TEST_CASES.forEach((thisCase) => {
    test(thisCase.description, () => {
      expect(asTermsHookAuthors(thisCase.given)).toEqual(thisCase.expect);
    });
  });
});
