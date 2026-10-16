import { given, then, when } from 'test-fns';

import { asRulesByName } from './asRulesByName';

const TEST_CASES: {
  description: string;
  given: { rulePaths: string[] };
  expect: { output: [string, string][] };
}[] = [
  {
    description: '[case1] no rule paths',
    given: { rulePaths: [] },
    expect: { output: [] },
  },
  {
    description: '[case2] each path keyed by its rule name',
    given: {
      rulePaths: [
        'practices/code.prod/rule.require.arrow-functions.md',
        'practices/code.test/rule.forbid.mocks.md',
      ],
    },
    expect: {
      output: [
        [
          'rule.require.arrow-functions.md',
          'practices/code.prod/rule.require.arrow-functions.md',
        ],
        ['rule.forbid.mocks.md', 'practices/code.test/rule.forbid.mocks.md'],
      ],
    },
  },
  {
    description: '[case3] an underscore name keys under its hyphen form',
    given: { rulePaths: ['practices/rule.forbid.positional_args.md'] },
    expect: {
      output: [
        [
          'rule.forbid.positional-args.md',
          'practices/rule.forbid.positional_args.md',
        ],
      ],
    },
  },
  {
    description: '[case4] two paths share a name — the later one wins',
    given: {
      rulePaths: [
        'practices/a/rule.forbid.mocks.md',
        'practices/b/rule.forbid.mocks.md',
      ],
    },
    expect: {
      output: [['rule.forbid.mocks.md', 'practices/b/rule.forbid.mocks.md']],
    },
  },
];

describe('asRulesByName', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the map is built', () => {
        then('each name maps to its rule path', () => {
          expect([...asRulesByName(thisCase.given).entries()]).toEqual(
            thisCase.expect.output,
          );
        });
      });
    }),
  );
});
