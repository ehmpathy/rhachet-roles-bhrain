import { given, then, when } from 'test-fns';

import { genReviewOutputStdout } from './genReviewOutputStdout';

describe('genReviewOutputStdout', () => {
  given('[case1] all good - no issues', () => {
    when('[t0] generated', () => {
      const stdout = genReviewOutputStdout({
        tokens: {
          input: 2260,
          cacheSet: 0,
          cacheGet: 192,
          output: 17,
          total: 2469,
        },
        cost: {
          total: '$0.000481',
        },
        time: {
          total: '21s',
        },
        paths: {
          logsRelative: '.log/bhrain/review/2026-01-28T12-00-00-000Z',
          reviewRelative: 'review-output.md',
        },
        summary: {
          blockersCount: 0,
          nitpicksCount: 0,
        },
      });

      then('matches snapshot', () => {
        expect(stdout).toMatchSnapshot();
      });

      then('shows all good message', () => {
        expect(stdout).toContain('all good 👍');
      });

      then('shows 0 blockers without emoji', () => {
        expect(stdout).toContain('0 blockers');
        expect(stdout).not.toContain('0 blockers 🔴');
      });

      then('shows 0 nitpicks without emoji', () => {
        expect(stdout).toContain('0 nitpicks');
        expect(stdout).not.toContain('0 nitpicks 🟠');
      });
    });
  });

  given('[case2] blockers only', () => {
    when('[t0] single blocker', () => {
      const stdout = genReviewOutputStdout({
        tokens: {
          input: 3000,
          cacheSet: 100,
          cacheGet: 0,
          output: 250,
          total: 3350,
        },
        cost: {
          total: '$0.001234',
        },
        time: {
          total: '15s',
        },
        paths: {
          logsRelative: '.log/bhrain/review/2026-01-28T12-00-00-000Z',
          reviewRelative: 'review-output.md',
        },
        summary: {
          blockersCount: 1,
          nitpicksCount: 0,
        },
      });

      then('matches snapshot', () => {
        expect(stdout).toMatchSnapshot();
      });

      then('shows singular blocker with emoji', () => {
        expect(stdout).toContain('1 blocker 🔴');
      });

      then('no issues found line', () => {
        expect(stdout).not.toContain('issues found');
        expect(stdout).toContain('└─ 0 nitpicks');
      });
    });

    when('[t1] multiple blockers', () => {
      const stdout = genReviewOutputStdout({
        tokens: {
          input: 3000,
          cacheSet: 100,
          cacheGet: 0,
          output: 500,
          total: 3600,
        },
        cost: {
          total: '$0.002500',
        },
        time: {
          total: '18s',
        },
        paths: {
          logsRelative: '.log/bhrain/review/2026-01-28T12-00-00-000Z',
          reviewRelative: 'review-output.md',
        },
        summary: {
          blockersCount: 3,
          nitpicksCount: 0,
        },
      });

      then('matches snapshot', () => {
        expect(stdout).toMatchSnapshot();
      });

      then('shows plural blockers with emoji', () => {
        expect(stdout).toContain('3 blockers 🔴');
      });
    });
  });

  given('[case3] nitpicks only', () => {
    when('[t0] single nitpick', () => {
      const stdout = genReviewOutputStdout({
        tokens: {
          input: 2000,
          cacheSet: 0,
          cacheGet: 500,
          output: 100,
          total: 2600,
        },
        cost: {
          total: '$0.000800',
        },
        time: {
          total: '10s',
        },
        paths: {
          logsRelative: '.log/bhrain/review/2026-01-28T12-00-00-000Z',
          reviewRelative: 'output.md',
        },
        summary: {
          blockersCount: 0,
          nitpicksCount: 1,
        },
      });

      then('matches snapshot', () => {
        expect(stdout).toMatchSnapshot();
      });

      then('shows singular nitpick with emoji', () => {
        expect(stdout).toContain('1 nitpick 🟠');
      });

      then('nitpicks is last line', () => {
        expect(stdout).not.toContain('issues found');
        expect(stdout.trim().endsWith('🟠')).toBe(true);
      });
    });

    when('[t1] multiple nitpicks', () => {
      const stdout = genReviewOutputStdout({
        tokens: {
          input: 2000,
          cacheSet: 0,
          cacheGet: 500,
          output: 200,
          total: 2700,
        },
        cost: {
          total: '$0.001000',
        },
        time: {
          total: '12s',
        },
        paths: {
          logsRelative: '.log/bhrain/review/2026-01-28T12-00-00-000Z',
          reviewRelative: 'output.md',
        },
        summary: {
          blockersCount: 0,
          nitpicksCount: 4,
        },
      });

      then('matches snapshot', () => {
        expect(stdout).toMatchSnapshot();
      });

      then('shows plural nitpicks with emoji', () => {
        expect(stdout).toContain('4 nitpicks 🟠');
      });
    });
  });

  given('[case4] both blockers and nitpicks', () => {
    when('[t0] mixed issues', () => {
      const stdout = genReviewOutputStdout({
        tokens: {
          input: 4000,
          cacheSet: 200,
          cacheGet: 100,
          output: 800,
          total: 5100,
        },
        cost: {
          total: '$0.005000',
        },
        time: {
          total: '25s',
        },
        paths: {
          logsRelative: '.log/bhrain/review/2026-01-28T12-00-00-000Z',
          reviewRelative: 'full-review.md',
        },
        summary: {
          blockersCount: 2,
          nitpicksCount: 3,
        },
      });

      then('matches snapshot', () => {
        expect(stdout).toMatchSnapshot();
      });

      then('shows blockers with emoji', () => {
        expect(stdout).toContain('2 blockers 🔴');
      });

      then('shows nitpicks with emoji', () => {
        expect(stdout).toContain('3 nitpicks 🟠');
      });

      then('nitpicks is last line', () => {
        expect(stdout).not.toContain('issues found');
        expect(stdout.trim().endsWith('🟠')).toBe(true);
      });
    });
  });

  given('[case5] large token counts', () => {
    when('[t0] numbers formatted with commas', () => {
      const stdout = genReviewOutputStdout({
        tokens: {
          input: 125000,
          cacheSet: 50000,
          cacheGet: 25000,
          output: 5000,
          total: 205000,
        },
        cost: {
          total: '$0.150000',
        },
        time: {
          total: '2m 30s',
        },
        paths: {
          logsRelative: '.log/bhrain/review/2026-01-28T12-00-00-000Z',
          reviewRelative: 'large-review.md',
        },
        summary: {
          blockersCount: 10,
          nitpicksCount: 25,
        },
      });

      then('matches snapshot', () => {
        expect(stdout).toMatchSnapshot();
      });

      then('formats large numbers with commas', () => {
        expect(stdout).toContain('125,000');
        expect(stdout).toContain('205,000');
      });
    });
  });
});
