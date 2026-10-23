import { asReflectRuleFileName } from './asReflectRuleFileName';

const TEST_CASES: Array<{
  description: string;
  given: { name: string };
  expect: { output: string };
}> = [
  {
    description: 'a name that carries the prefix passes through untouched',
    given: { name: 'rule.forbid.gerunds.md' },
    expect: { output: 'rule.forbid.gerunds.md' },
  },
  {
    description: 'a name the brain wrote without the prefix gains it',
    given: { name: 'forbid.gerunds.md' },
    expect: { output: 'rule.forbid.gerunds.md' },
  },
  {
    description:
      'a name with `rule` inside but not at the head gains the prefix',
    given: { name: 'prefer.rule-names.md' },
    expect: { output: 'rule.prefer.rule-names.md' },
  },
  {
    description: 'the transform is idempotent',
    given: { name: asReflectRuleFileName({ name: 'require.tests.md' }) },
    expect: { output: 'rule.require.tests.md' },
  },
];

describe('asReflectRuleFileName', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asReflectRuleFileName(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
