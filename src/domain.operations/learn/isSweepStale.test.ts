import { given, then, when } from 'test-fns';

import { isSweepStale, SWEEP_STALENESS_THRESHOLD_MS } from './isSweepStale';

describe('isSweepStale', () => {
  const now = new Date('2026-07-22T12:00:00Z');

  given('[case1] no sentinel yet (absent progress file)', () => {
    when('[t0] mtime is null', () => {
      then('is stale (first stop earns a nudge)', () => {
        expect(isSweepStale({ mtime: null, articulated: false, now })).toEqual(
          true,
        );
      });
    });
  });

  given('[case2] a fresh, articulated distillation', () => {
    when(
      '[t0] mtime is 5 minutes ago and the content is a real articulation',
      () => {
        then('is not stale (the session rests)', () => {
          const mtime = new Date(now.getTime() - 5 * 60 * 1000);
          expect(isSweepStale({ mtime, articulated: true, now })).toEqual(
            false,
          );
        });
      },
    );
  });

  given('[case3] a stale distillation', () => {
    when('[t0] mtime is 2 hours ago', () => {
      then('is stale', () => {
        const mtime = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        expect(isSweepStale({ mtime, articulated: true, now })).toEqual(true);
      });
    });
  });

  given('[case4] a fresh mtime but NO real articulation (a bare touch)', () => {
    when(
      '[t0] mtime is 5 minutes ago but the content is not articulated',
      () => {
        then('is stale — a touch cannot silence the nudge', () => {
          // the content-shape guard: a recent mtime alone is not enough; without a
          // real articulation the nudge holds (the wish's one hard requirement)
          const mtime = new Date(now.getTime() - 5 * 60 * 1000);
          expect(isSweepStale({ mtime, articulated: false, now })).toEqual(
            true,
          );
        });
      },
    );
  });

  given('[case5] the exact threshold boundary (articulated)', () => {
    when('[t0] mtime is exactly the threshold ago', () => {
      then('is not stale (strictly greater-than trips it)', () => {
        const mtime = new Date(now.getTime() - SWEEP_STALENESS_THRESHOLD_MS);
        expect(isSweepStale({ mtime, articulated: true, now })).toEqual(false);
      });
    });

    when('[t1] mtime is one ms past the threshold', () => {
      then('is stale', () => {
        const mtime = new Date(
          now.getTime() - SWEEP_STALENESS_THRESHOLD_MS - 1,
        );
        expect(isSweepStale({ mtime, articulated: true, now })).toEqual(true);
      });
    });
  });
});
