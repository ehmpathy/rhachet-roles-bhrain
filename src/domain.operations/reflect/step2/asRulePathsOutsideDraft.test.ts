import { given, then, when } from 'test-fns';

import { asRulePathsOutsideDraft } from './asRulePathsOutsideDraft';

const TEST_CASES: {
  description: string;
  given: { rulePaths: string[] };
  expect: { output: string[] };
}[] = [
  {
    description: '[case1] no rule paths',
    given: { rulePaths: [] },
    expect: { output: [] },
  },
  {
    description: '[case2] no path sits in the draft dir',
    given: { rulePaths: ['practices/a.md', 'b.md'] },
    expect: { output: ['practices/a.md', 'b.md'] },
  },
  {
    description: '[case3] draft paths are dropped, order kept',
    given: {
      rulePaths: ['practices/a.md', '.draft/pure/b.md', 'c.md', '.draft/c.md'],
    },
    expect: { output: ['practices/a.md', 'c.md'] },
  },
  {
    description: '[case4] a dir whose name only opens with .draft is kept',
    given: { rulePaths: ['.drafts/a.md', 'practices/.draft/b.md'] },
    expect: { output: ['.drafts/a.md', 'practices/.draft/b.md'] },
  },
];

describe('asRulePathsOutsideDraft', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the draft paths are filtered', () => {
        then('only the paths outside .draft/ remain', () => {
          expect(asRulePathsOutsideDraft(thisCase.given)).toEqual(
            thisCase.expect.output,
          );
        });
      });
    }),
  );
});
