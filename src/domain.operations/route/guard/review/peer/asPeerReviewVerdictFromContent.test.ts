import { given, then, useThen, when } from 'test-fns';

import { asPeerReviewVerdictFromContent } from './asPeerReviewVerdictFromContent';

describe('asPeerReviewVerdictFromContent', () => {
  given('[case1] a persisted review whose counts read', () => {
    when('[t0] the verdict is read', () => {
      then('its counts pass through verbatim', () => {
        const verdict = asPeerReviewVerdictFromContent({
          content: 'review body\n\n2 blockers\n3 nitpicks\n',
        });
        expect(verdict.blockers).toEqual(2);
        expect(verdict.nitpicks).toEqual(3);
      });
    });
  });

  given('[case2] a persisted review whose counts do NOT read', () => {
    // both readers of a persisted review — the current-hash cache and the
    // cross-hash fallback — read through this one transformer. before it, the
    // cache read an unreadable tally as 0/0 while the fallback read 1 blocker,
    // so one file nobody touched reported two counts by the path that read it
    when('[t0] the verdict is read', () => {
      then('it gates as one blocker, never a clean 0/0', () => {
        const verdict = asPeerReviewVerdictFromContent({
          content: 'looks solid, ship it\n',
        });
        expect(verdict.blockers).toEqual(1);
        expect(verdict.nitpicks).toEqual(0);
      });
    });
  });

  given(
    '[case3] a persisted review that exited as a genuine constraint',
    () => {
      // the given a reviewer leaves when it could not run (exit 2): stderr, no tally.
      // the meter reads `constraint` only at exit 2 with zero blockers, so a fabricated
      // blocker here repaints the lane `rejected` — measured in
      // driver.route.peer-review-exit-codes, where the 🗿 guard tree read `rejected 0/0`
      // under a 🦉 tree that said `constraint ✋` for the same reviewer, same pass
      const CONTENT_CONSTRAINT = [
        '├─ stderr',
        '│  ├─',
        '│  │',
        '│  │  error: API key not configured for review',
        '│  │',
        '│  └─',
        '└─ passage blocked',
        '   ├─ blocked by constraints',
        '   └─ exit code: 2 ✋',
        '',
      ].join('\n');

      when('[t0] the verdict is read', () => {
        const verdict = useThen('it is read', async () =>
          asPeerReviewVerdictFromContent({ content: CONTENT_CONSTRAINT }),
        );

        then('its exit reads as the constraint class', () => {
          expect(verdict.exitCode).toEqual(2);
          expect(verdict.exitClass).toEqual('constraint');
        });

        then(
          'it carries no fabricated blocker — the class is the verdict',
          () => {
            expect(verdict.blockers).toEqual(0);
            expect(verdict.nitpicks).toEqual(0);
          },
        );
      });
    },
  );

  given(
    '[case4] a persisted review that exited as a constraint WITH a tally',
    () => {
      // exit 2 with blockers is a reviewer that ran and found issues — a normal
      // rejection. the tally must still pass through, or the rejection is lost
      when('[t0] the verdict is read', () => {
        then('its counts pass through verbatim', () => {
          const verdict = asPeerReviewVerdictFromContent({
            content:
              '2 blockers\n0 nitpicks\n\n└─ passage blocked\n   └─ exit code: 2 ✋\n',
          });
          expect(verdict.exitClass).toEqual('constraint');
          expect(verdict.blockers).toEqual(2);
        });
      });
    },
  );
});
