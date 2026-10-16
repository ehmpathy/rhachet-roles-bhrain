import { given, then, when } from 'test-fns';

import { asRulePathSet } from './asRulePathSet';

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
    description: '[case2] paths already in join form',
    given: { rulePaths: ['practices/a.md', 'practices/b.md'] },
    expect: { output: ['practices/a.md', 'practices/b.md'] },
  },
  {
    description: '[case3] a doubled slash reads as one path',
    given: { rulePaths: ['practices//a.md', 'practices/a.md'] },
    expect: { output: ['practices/a.md'] },
  },
  {
    description: '[case4] a dot segment reads as its join form',
    given: { rulePaths: ['practices/./code.prod/../a.md'] },
    expect: { output: ['practices/a.md'] },
  },
];

describe('asRulePathSet', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the set is built', () => {
        then('it holds each path once, in join form', () => {
          expect([...asRulePathSet(thisCase.given)]).toEqual(
            thisCase.expect.output,
          );
        });
      });
    }),
  );
});
