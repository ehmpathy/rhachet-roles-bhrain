import { given, then, when } from 'test-fns';

import type { ReviewRubric } from './asReviewRubricsConfig';
import { genReviewRubricCmd } from './genReviewRubricCmd';

const rubricOneRule: ReviewRubric = {
  slug: 'mech-failhides',
  rules: ['.agent/**/rule.forbid.failhide.md'],
};

const rubricMultiRule: ReviewRubric = {
  slug: 'mech-multi',
  rules: ['.agent/**/rule.a.md', '.agent/**/rule.b.md'],
};

describe('genReviewRubricCmd', () => {
  given('[case1] a rubric with paths + brain forwarded', () => {
    when('[t0] the cmd is built', () => {
      const cmd = genReviewRubricCmd({
        rubric: rubricOneRule,
        output: '.reviews/by=mechanic/rubric=mech-failhides.md',
        paths: 'src/**/*.ts',
        diffs: null,
        mode: null,
        brain: 'fireworks/deepseek/v4-flash',
      });

      then('it starts with rhx review', () => {
        expect(cmd.startsWith('rhx review ')).toEqual(true);
      });

      then('it carries the rubric rules as --rules', () => {
        expect(cmd).toContain("--rules '.agent/**/rule.forbid.failhide.md'");
      });

      then('it forwards --paths-with', () => {
        expect(cmd).toContain("--paths-with 'src/**/*.ts'");
      });

      then('it forwards --brain', () => {
        expect(cmd).toContain("--brain 'fireworks/deepseek/v4-flash'");
      });

      then('it carries the output path', () => {
        expect(cmd).toContain(
          "--output '.reviews/by=mechanic/rubric=mech-failhides.md'",
        );
      });
    });
  });

  given('[case2] a rubric with multiple rules', () => {
    when('[t0] the cmd is built', () => {
      const cmd = genReviewRubricCmd({
        rubric: rubricMultiRule,
        output: 'out.md',
        paths: null,
        diffs: null,
        mode: null,
        brain: null,
      });

      then('it emits ONE --rules flag per rule (never a comma-join)', () => {
        // review's --rules is a globby pattern; globby does NOT split on commas, so a
        // comma-joined 'a.md,b.md' matches no files. a repeated flag is the form that resolves.
        expect(cmd).toContain("--rules '.agent/**/rule.a.md'");
        expect(cmd).toContain("--rules '.agent/**/rule.b.md'");
        expect(cmd).not.toContain(
          "--rules '.agent/**/rule.a.md,.agent/**/rule.b.md'",
        );
      });
    });
  });

  given('[case3] a rubric with diffs forwarded', () => {
    when('[t0] the cmd is built', () => {
      const cmd = genReviewRubricCmd({
        rubric: rubricOneRule,
        output: 'out.md',
        paths: null,
        diffs: 'since-main',
        mode: null,
        brain: null,
      });

      then('it forwards --diffs', () => {
        expect(cmd).toContain("--diffs 'since-main'");
      });
    });
  });

  given('[case5] a value that holds a single quote', () => {
    when('[t0] the cmd is built', () => {
      const cmd = genReviewRubricCmd({
        rubric: { slug: 'quirky', rules: [".agent/o'brien.md"] },
        output: 'out.md',
        paths: "src/o'neil/**/*.ts",
        diffs: null,
        mode: null,
        brain: null,
      });

      then('it escapes the quote POSIX-safely (no early quote close)', () => {
        expect(cmd).toContain("--rules '.agent/o'\\''brien.md'");
        expect(cmd).toContain("--paths-with 'src/o'\\''neil/**/*.ts'");
      });
    });
  });

  given('[case4] a rubric with no optional flags', () => {
    when('[t0] the cmd is built', () => {
      const cmd = genReviewRubricCmd({
        rubric: rubricOneRule,
        output: 'out.md',
        paths: null,
        diffs: null,
        mode: null,
        brain: null,
      });

      then('it emits only rules + output', () => {
        expect(cmd).toEqual(
          "rhx review --rules '.agent/**/rule.forbid.failhide.md' --output 'out.md'",
        );
      });

      then('it omits the unset flags', () => {
        expect(cmd).not.toContain('--paths-with');
        expect(cmd).not.toContain('--diffs');
        expect(cmd).not.toContain('--brain');
        expect(cmd).not.toContain('--focus');
      });
    });
  });
});
