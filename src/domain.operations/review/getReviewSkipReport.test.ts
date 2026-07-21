import { given, then, when } from 'test-fns';

import { getReviewSkipReport } from '@src/domain.operations/review/getReviewSkipReport';

describe('getReviewSkipReport', () => {
  given('[case1] a rules-supply skip with a single glob', () => {
    when('[t0] the skip report is built', () => {
      const report = getReviewSkipReport({
        supply: 'rules',
        globs: ['rules/DOES_NOT_EXIST/*.md'],
        reviewDisplayPath: '.reviews/peer/report.md',
      });

      then('the header names the 🌙 skipped reason', () => {
        expect(report).toContain(
          '🌙 skipped — no rules found (--optional rules)',
        );
      });

      then('it carries the real 0/0 counts the guard reads as approved', () => {
        expect(report).toContain('0 blockers');
        expect(report).toContain('0 nitpicks');
      });

      then('it echoes the review display path', () => {
        expect(report).toContain('review: .reviews/peer/report.md');
      });

      then('it advertises no log dir — a skip writes no log artifacts', () => {
        expect(report).not.toContain('logs:');
      });

      then('the body names the ineffective glob', () => {
        expect(report).toContain(
          '_no rules matched the --optional rules glob (rules/DOES_NOT_EXIST/*.md); review skipped._',
        );
      });

      then('the report matches its snapshot', () => {
        expect(report).toMatchSnapshot();
      });
    });
  });

  given('[case2] a rules-supply skip with multiple globs', () => {
    when('[t0] the skip report is built', () => {
      then('the body joins the globs with a comma', () => {
        const report = getReviewSkipReport({
          supply: 'rules',
          globs: ['rules/a/*.md', 'rules/b/*.md'],
          reviewDisplayPath: '/abs/out.md',
        });
        expect(report).toContain('(rules/a/*.md, rules/b/*.md)');
      });
    });
  });
});
