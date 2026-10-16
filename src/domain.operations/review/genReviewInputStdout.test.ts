import { given, then, when } from 'test-fns';

import { genReviewInputStdout } from './genReviewInputStdout';

describe('genReviewInputStdout', () => {
  given('[case1] no refs provided', () => {
    when('[t0] generated', () => {
      const stdout = genReviewInputStdout({
        files: {
          rulesCount: 3,
          refsCount: 0,
          conversationCount: 0,
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
        attribution: 'attributed',
        warnings: [],
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
        // the rows the snapshot pins, asserted by value beside it
        expect(stdout).toContain('│  ├─ rules: 3\n   │  └─ targets: 12\n');
        expect(stdout).toContain(
          '│  ├─ estimate: 2,500\n   │  └─ context: 1.2%',
        );
        expect(stdout).toContain('└─ estimate: $0.0125');
        expect(stdout).toContain('├─ rules: rules (1.2k, 48%)');
        expect(stdout).toMatchSnapshot();
      });

      then('does not include refs line', () => {
        expect(stdout).not.toContain('refs:');
      });
    });
  });

  given('[case1b] a prior peer-review conversation is carried', () => {
    when('[t0] refs and conversation are both present', () => {
      const stdout = genReviewInputStdout({
        files: {
          rulesCount: 1,
          refsCount: 1,
          conversationCount: 4,
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
        attribution: 'attributed',
        warnings: [],
        preview: {
          ruleDirs: [{ path: 'rules', tokensHuman: '800', tokensScale: '53%' }],
          targetDirs: [{ path: 'src', tokensHuman: '700', tokensScale: '47%' }],
        },
      });

      then('the conversation count renders beside refs, before targets', () => {
        expect(stdout).toContain('├─ refs: 1\n   │  ├─ conversation: 4\n');
        expect(stdout).toContain('└─ targets: 5');
      });

      then('matches snapshot', () => {
        expect(stdout).toContain('│  ├─ rules: 1\n');
        expect(stdout).toContain('└─ estimate: $0.0075');
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given('[case1c] file counts past a thousand', () => {
    when('[t0] generated', () => {
      const stdout = genReviewInputStdout({
        files: {
          rulesCount: 1200,
          refsCount: 3400,
          conversationCount: 1001,
          targetsCount: 5978,
        },
        tokens: {
          estimate: 700000,
          contextWindowPercent: 12.5,
        },
        cost: {
          estimate: '$0.35',
        },
        logDirRelative: '.log/bhrain/review/2026-01-28T12-00-00-000Z',
        attribution: 'attributed',
        warnings: [],
        preview: { ruleDirs: [], targetDirs: [] },
      });

      then('each count groups its digits, like the estimate', () => {
        expect(stdout).toContain('│  ├─ rules: 1,200\n');
        expect(stdout).toContain('│  ├─ refs: 3,400\n');
        expect(stdout).toContain('│  ├─ conversation: 1,001\n');
        expect(stdout).toContain('│  └─ targets: 5,978\n');
        expect(stdout).toContain('│  ├─ estimate: 700,000\n');
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given('[case2] refs provided', () => {
    when('[t0] single ref', () => {
      const stdout = genReviewInputStdout({
        files: {
          rulesCount: 1,
          refsCount: 1,
          conversationCount: 0,
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
        attribution: 'attributed',
        warnings: [],
        preview: {
          ruleDirs: [{ path: 'rules', tokensHuman: '800', tokensScale: '53%' }],
          targetDirs: [{ path: 'src', tokensHuman: '700', tokensScale: '47%' }],
        },
      });

      then('matches snapshot', () => {
        expect(stdout).toContain('│  ├─ refs: 1\n   │  └─ targets: 5\n');
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
          conversationCount: 0,
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
        attribution: 'attributed',
        warnings: [],
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
        // two target dirs render on one row, heaviest first, and close the branch
        expect(stdout).toContain(
          '└─ targets: src (1.5k, 30%), lib (1.0k, 20%)',
        );
        expect(stdout).toMatchSnapshot();
      });

      then('includes refs count', () => {
        expect(stdout).toContain('refs: 5');
      });
    });
  });

  given('[case3] a prompt whose census could NOT vouch for its rows', () => {
    const asStdout = (input: {
      attribution: 'attributed' | 'unattributed';
    }): string =>
      genReviewInputStdout({
        files: {
          rulesCount: 1,
          refsCount: 0,
          conversationCount: 0,
          targetsCount: 2,
        },
        tokens: { estimate: 1000, contextWindowPercent: 0.5 },
        cost: { estimate: '$0.005' },
        logDirRelative: '.log/bhrain/review/2026-01-28T12-00-00-000Z',
        attribution: input.attribution,
        warnings: [],
        preview: { ruleDirs: [], targetDirs: [] },
      });

    when('[t0] the live run renders its expected metrics', () => {
      const stdout = asStdout({ attribution: 'unattributed' });

      then('🔴 the caveat renders LIVE, not only in a later cost read', () => {
        // until 2026-09-26 it rendered only in `review._.cost`, a second command a
        // driver would have to know to run
        expect(stdout).toContain('🟡 UNATTRIBUTED');
      });

      then('the caveat closes the tokens branch', () => {
        expect(stdout).toContain('│  ├─ context: 0.5%');
        expect(stdout).toMatchSnapshot();
      });
    });

    when('[t1] the census vouched for its rows', () => {
      const stdout = asStdout({ attribution: 'attributed' });

      then('no caveat renders — an attributed prompt costs no line', () => {
        expect(stdout).not.toContain('UNATTRIBUTED');
        expect(stdout).toContain('│  └─ context: 0.5%');
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given('[case4] a prompt the compiler flagged past 60% of the window', () => {
    const asStdout = (input: {
      attribution: 'attributed' | 'unattributed';
    }): string =>
      genReviewInputStdout({
        files: {
          rulesCount: 1,
          refsCount: 0,
          conversationCount: 0,
          targetsCount: 40,
        },
        tokens: { estimate: 700000, contextWindowPercent: 68.4 },
        cost: { estimate: '$0.35' },
        logDirRelative: '.log/bhrain/review/2026-01-28T12-00-00-000Z',
        attribution: input.attribution,
        warnings: [
          'potential quality degradation: prompt uses 68.4% of context window',
        ],
        preview: { ruleDirs: [], targetDirs: [] },
      });

    when('[t0] the live run renders its expected metrics', () => {
      const stdout = asStdout({ attribution: 'attributed' });

      then(
        '🔴 the caveat renders LIVE — it was once returned and never read',
        () => {
          expect(stdout).toContain(
            '│  └─ 🟡 potential quality degradation: prompt uses 68.4% of context window',
          );
          expect(stdout).toContain('│  ├─ context: 68.4%');
          expect(stdout).toMatchSnapshot();
        },
      );
    });

    when('[t1] the census also could not vouch for its rows', () => {
      const stdout = asStdout({ attribution: 'unattributed' });

      then('both caveats render, and the tree closes on the last', () => {
        expect(stdout).toContain('│  ├─ 🟡 potential quality degradation');
        expect(stdout).toContain('│  ├─ 🟡 UNATTRIBUTED');
        // the caveat names its next step, and that step closes the branch
        expect(stdout).toContain(
          '│  └─ inspect once it settles: rhx review._.cost --of run --at',
        );
        expect(stdout).toMatchSnapshot();
      });
    });
  });
});
