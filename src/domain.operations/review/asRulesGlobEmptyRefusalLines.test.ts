import { given, then, when } from 'test-fns';

import { asRulesGlobEmptyRefusalLines } from './asRulesGlobEmptyRefusalLines';

describe('asRulesGlobEmptyRefusalLines', () => {
  given('[case1] two rule globs that matched no file', () => {
    when('[t0] the lines are rendered', () => {
      const lines = asRulesGlobEmptyRefusalLines({
        ruleGlobs: ['.agent/**/rule.*.md', 'briefs/rule.*.md'],
      });

      then(
        'it names every glob as the closed tree, then the hint as its own block',
        () => {
          expect(lines).toEqual([
            '   └─ rules: .agent/**/rule.*.md, briefs/rule.*.md',
            '',
            '✨ did you know?',
            '   └─ verify the glob pattern matches files in your repo',
          ]);
          expect(lines).toMatchSnapshot();
        },
      );
    });
  });

  given('[case2] one value that joins two globs with a comma', () => {
    when('[t0] the lines are rendered', () => {
      const lines = asRulesGlobEmptyRefusalLines({
        ruleGlobs: ['briefs/rule.a.md,briefs/rule.b.md'],
      });

      then(
        'the hint names the comma, and the fix is to repeat the flag',
        () => {
          expect(lines.at(-1)).toEqual(
            '   └─ a comma does not split a glob — repeat --rules once per glob',
          );
        },
      );
    });
  });

  given('[case3] a comma inside a brace group', () => {
    when('[t0] the lines are rendered', () => {
      const lines = asRulesGlobEmptyRefusalLines({
        ruleGlobs: ['briefs/rule.{a,b}.md'],
      });

      then('the comma is glob syntax, so the generic hint stays', () => {
        expect(lines.at(-1)).toEqual(
          '   └─ verify the glob pattern matches files in your repo',
        );
      });
    });
  });
});
