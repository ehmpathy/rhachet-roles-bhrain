import { given, then, when } from 'test-fns';

import { asRuleName } from './asRuleName';

const TEST_CASES: {
  description: string;
  given: { rulePath: string };
  expect: { output: string };
}[] = [
  {
    description: '[case1] a nested rule path',
    given: { rulePath: 'practices/code.prod/rule.require.arrow-functions.md' },
    expect: { output: 'rule.require.arrow-functions.md' },
  },
  {
    description: '[case2] a bare filename',
    given: { rulePath: 'rule.forbid.gerunds.md' },
    expect: { output: 'rule.forbid.gerunds.md' },
  },
  {
    description: '[case3] underscores in the name',
    given: { rulePath: 'practices/rule.forbid.positional_args.md' },
    expect: { output: 'rule.forbid.positional-args.md' },
  },
  {
    description: '[case4] upper case in the name',
    given: { rulePath: 'practices/Rule.Require.Named_Args.md' },
    expect: { output: 'rule.require.named-args.md' },
  },
  {
    description: '[case5] underscores in a parent dir only',
    given: { rulePath: 'code_prod/rule.require.tests.md' },
    expect: { output: 'rule.require.tests.md' },
  },
];

describe('asRuleName', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the rule name is read', () => {
        then(`it reads ${thisCase.expect.output}`, () => {
          expect(asRuleName(thisCase.given)).toEqual(thisCase.expect.output);
        });
      });
    }),
  );
});
