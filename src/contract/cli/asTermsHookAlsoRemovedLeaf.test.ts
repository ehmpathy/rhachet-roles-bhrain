import { TERMS_HOOK_DECLARED } from '@src/domain.operations/learn/termsHook/TERMS_HOOK_DECLARED';

import { asTermsHookAlsoRemovedLeaf } from './asTermsHookAlsoRemovedLeaf';

const TOGGLE: string = TERMS_HOOK_DECLARED.author;
const LEARNER = 'repo=bhrain/role=learner';

const TEST_CASES: {
  description: string;
  given: { authorsRemoved: string[] };
  expect: string | null;
}[] = [
  {
    description: 'naught removed: no leaf',
    given: { authorsRemoved: [] },
    expect: null,
  },
  {
    description: 'only the toggle entry removed: no leaf',
    given: { authorsRemoved: [TOGGLE] },
    expect: null,
  },
  {
    description: 'one foreign entry: an entry, its author one child row',
    given: { authorsRemoved: [LEARNER, TOGGLE] },
    expect: [
      '   ├─ also removed = an entry the toggle did not write',
      `   │  └─ by ${LEARNER}`,
    ].join('\n'),
  },
  {
    description:
      'two foreign entries by one author: counted, the author named once',
    given: { authorsRemoved: [LEARNER, LEARNER] },
    expect: [
      '   ├─ also removed = 2 entries the toggle did not write',
      `   │  └─ by ${LEARNER}`,
    ].join('\n'),
  },
  {
    description:
      'two authors, one without a name: each one row, in order, the absent one in words',
    given: { authorsRemoved: [LEARNER, TOGGLE, '(no author)'] },
    expect: [
      '   ├─ also removed = 2 entries the toggle did not write',
      `   │  ├─ by ${LEARNER}`,
      '   │  └─ with no author',
    ].join('\n'),
  },
];

describe('asTermsHookAlsoRemovedLeaf', () => {
  TEST_CASES.forEach((thisCase) => {
    test(thisCase.description, () => {
      expect(asTermsHookAlsoRemovedLeaf(thisCase.given)).toEqual(
        thisCase.expect,
      );
    });
  });
});
