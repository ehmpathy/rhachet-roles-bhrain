import { given, then, when } from 'test-fns';

import { genReviewInputStdout } from './genReviewInputStdout';

describe('genReviewInputStdout', () => {
  given('[case1] no refs provided', () => {
    when('[t0] generated', () => {
      const stdout = genReviewInputStdout({
        files: {
          rulesCount: 3,
          refsCount: 0,
          targetsCount: 12,
        },
        tokens: {
          estimate: 2500,
          contextWindowPercent: 1.2,
        },
        cost: {
          estimate: '$0.0125',
        },
        logDirRelative: '.log/bhrain/review/2026-01-28T12-00-00-000Z',
        preview: {
          ruleDirs: [
            { path: 'rules', tokensHuman: '1.2k', tokensScale: '48%' },
          ],
          targetDirs: [
            { path: 'src', tokensHuman: '1.3k', tokensScale: '52%' },
          ],
        },
      });

      then('matches snapshot', () => {
        expect(stdout).toMatchSnapshot();
      });

      then('does not include refs line', () => {
        expect(stdout).not.toContain('refs:');
      });
    });
  });

  given('[case2] refs provided', () => {
    when('[t0] single ref', () => {
      const stdout = genReviewInputStdout({
        files: {
          rulesCount: 1,
          refsCount: 1,
          targetsCount: 5,
        },
        tokens: {
          estimate: 1500,
          contextWindowPercent: 0.6,
        },
        cost: {
          estimate: '$0.0075',
        },
        logDirRelative: '.log/bhrain/review/2026-01-28T12-00-00-000Z',
        preview: {
          ruleDirs: [{ path: 'rules', tokensHuman: '800', tokensScale: '53%' }],
          targetDirs: [{ path: 'src', tokensHuman: '700', tokensScale: '47%' }],
        },
      });

      then('matches snapshot', () => {
        expect(stdout).toMatchSnapshot();
      });

      then('includes refs line', () => {
        expect(stdout).toContain('refs: 1');
      });
    });

    when('[t1] multiple refs', () => {
      const stdout = genReviewInputStdout({
        files: {
          rulesCount: 2,
          refsCount: 5,
          targetsCount: 20,
        },
        tokens: {
          estimate: 5000,
          contextWindowPercent: 2.5,
        },
        cost: {
          estimate: '$0.025',
        },
        logDirRelative: '.log/bhrain/review/2026-01-28T12-00-00-000Z',
        preview: {
          ruleDirs: [
            { path: 'rules', tokensHuman: '2.5k', tokensScale: '50%' },
          ],
          targetDirs: [
            { path: 'src', tokensHuman: '1.5k', tokensScale: '30%' },
            { path: 'lib', tokensHuman: '1.0k', tokensScale: '20%' },
          ],
        },
      });

      then('matches snapshot', () => {
        expect(stdout).toMatchSnapshot();
      });

      then('includes refs count', () => {
        expect(stdout).toContain('refs: 5');
      });
    });
  });
});
