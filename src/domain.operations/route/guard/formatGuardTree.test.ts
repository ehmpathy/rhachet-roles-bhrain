import { given, then, when } from 'test-fns';

import { formatGuardTree } from './formatGuardTree';

describe('formatGuardTree', () => {
  given(
    '[case1] reviews+judges, allowed, all fresh — 2 reviews (0 blockers, 3 blockers) and 1 judge (passed)',
    () => {
      when('[t0] called with fresh results', () => {
        then('output matches snapshot', () => {
          const result = formatGuardTree({
            stone: '1.vision',
            passage: 'allowed',
            note: null,
            reason: null,
            guard: {
              artifactFiles: ['1.vision.v1.md'],
              reviews: [
                {
                  index: 1,
                  cmd: 'reviewer/reflect',
                  cached: false,
                  durationSec: 8.2,
                  blockers: 0,
                  nitpicks: 0,
                  path: '.route/1.vision.guard.review.i1.abc123.r1.md',
                },
                {
                  index: 2,
                  cmd: 'reviewer/review',
                  cached: false,
                  durationSec: 15.1,
                  blockers: 3,
                  nitpicks: 1,
                  path: '.route/1.vision.guard.review.i1.abc123.r2.md',
                },
              ],
              judges: [
                {
                  index: 1,
                  cmd: 'reviewed?',
                  cached: false,
                  durationSec: 0.8,
                  passed: true,
                  reason: 'reviews pass (blockers: 0/0, nitpicks: 0/0)',
                  path: '.route/1.vision.guard.judge.i1p1.abc123.def456.j1.md',
                },
              ],
            },
          });
          expect(result).toContain('passage = allowed');
          expect(result).toContain('finished 8.2s ✓');
          expect(result).toContain('finished 15.1s ✓');
          expect(result).toContain('3 blockers 🔴');
          expect(result).toContain('1 nitpick 🟠');
          expect(result).toContain('finished 0.8s ✓');
          expect(result).not.toContain('reason:');
          expect(result).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case2] reviews+judges, blocked, all fresh — 1 review (1 blocker) and 1 judge (failed)',
    () => {
      when('[t0] called with blocked results', () => {
        then('output matches snapshot', () => {
          const result = formatGuardTree({
            stone: '3.1.research.domain',
            passage: 'blocked',
            note: null,
            reason: 'blockers exceed threshold (1 > 0)',
            guard: {
              artifactFiles: ['3.1.research.domain._.v1.md'],
              reviews: [
                {
                  index: 1,
                  cmd: 'reviewer/reflect',
                  cached: false,
                  durationSec: 12.4,
                  blockers: 1,
                  nitpicks: 0,
                  path: '.route/3.1.research.domain.guard.review.i1.abc123.r1.md',
                },
              ],
              judges: [
                {
                  index: 1,
                  cmd: 'reviewed?',
                  cached: false,
                  durationSec: 0.8,
                  passed: false,
                  reason: 'blockers exceed threshold (1 > 0)',
                  path: '.route/3.1.research.domain.guard.judge.i1p1.abc123.def456.j1.md',
                },
              ],
            },
          });
          expect(result).toContain('passage = blocked');
          expect(result).toContain(
            'reason = blockers exceed threshold (1 > 0)',
          );
          expect(result).toContain('finished 12.4s ✓');
          expect(result).toContain('1 blocker 🔴');
          expect(result).toContain('finished 0.8s ✗');
          expect(result).toContain('reason: blockers exceed threshold (1 > 0)');
          expect(result).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case3] some cached reviews — 1 cached + 1 fresh review, 1 judge',
    () => {
      when('[t0] called with mixed cache state', () => {
        then('output matches snapshot', () => {
          const result = formatGuardTree({
            stone: '1.vision',
            passage: 'allowed',
            note: null,
            reason: null,
            guard: {
              artifactFiles: ['1.vision.v1.md'],
              reviews: [
                {
                  index: 1,
                  cmd: 'reviewer/reflect',
                  cached: true,
                  durationSec: null,
                  blockers: 0,
                  nitpicks: 0,
                  path: '.route/1.vision.guard.review.i1.abc123.r1.md',
                },
                {
                  index: 2,
                  cmd: 'reviewer/review',
                  cached: false,
                  durationSec: 10.3,
                  blockers: 0,
                  nitpicks: 2,
                  path: '.route/1.vision.guard.review.i1.abc123.r2.md',
                },
              ],
              judges: [
                {
                  index: 1,
                  cmd: 'reviewed?',
                  cached: false,
                  durationSec: 0.5,
                  passed: true,
                  reason: null,
                  path: '.route/1.vision.guard.judge.i1p1.abc123.def456.j1.md',
                },
              ],
            },
          });
          expect(result).toContain('· cached');
          expect(result).toContain('finished 10.3s ✓');
          expect(result).toContain('2 nitpicks 🟠');
          expect(result).toMatchSnapshot();
        });
      });
    },
  );

  given('[case4] all cached — all reviews + judges cached', () => {
    when('[t0] called with all cached', () => {
      then('output matches snapshot', () => {
        const result = formatGuardTree({
          stone: '1.vision',
          passage: 'allowed',
          note: null,
          reason: null,
          guard: {
            artifactFiles: ['1.vision.v1.md'],
            reviews: [
              {
                index: 1,
                cmd: 'reviewer/reflect',
                cached: true,
                durationSec: null,
                blockers: 0,
                nitpicks: 0,
                path: '.route/1.vision.guard.review.i1.abc123.r1.md',
              },
            ],
            judges: [
              {
                index: 1,
                cmd: 'reviewed?',
                cached: true,
                durationSec: null,
                passed: true,
                reason: null,
                path: '.route/1.vision.guard.judge.i1p1.abc123.def456.j1.md',
              },
            ],
          },
        });
        expect(result).toContain('· cached');
        expect(result).not.toContain('finished');
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case5] unguarded stone — no guard input', () => {
    when('[t0] called with no guard', () => {
      then('output matches snapshot', () => {
        const result = formatGuardTree({
          stone: '1.vision',
          passage: 'allowed',
          note: 'unguarded',
          reason: null,
          guard: null,
        });
        expect(result).toContain('passage = allowed (unguarded)');
        expect(result).not.toContain('└─ guard');
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case6] artifacts only guard — no reviews or judges', () => {
    when('[t0] called with empty reviews and judges', () => {
      then('output matches snapshot', () => {
        const result = formatGuardTree({
          stone: '1.vision',
          passage: 'allowed',
          note: 'artifacts only',
          reason: null,
          guard: {
            artifactFiles: ['1.vision.v1.md'],
            reviews: [],
            judges: [],
          },
        });
        expect(result).toContain('passage = allowed (artifacts only)');
        expect(result).toContain('artifacts');
        expect(result).not.toContain('reviews');
        expect(result).not.toContain('judges');
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case7] multiple artifacts — 3 artifact files', () => {
    when('[t0] called with 3 artifacts', () => {
      then('output matches snapshot', () => {
        const result = formatGuardTree({
          stone: '3.1.research.domain',
          passage: 'allowed',
          note: null,
          reason: null,
          guard: {
            artifactFiles: [
              '3.1.research.domain._.v1.md',
              '3.1.research.domain.terms.v1.md',
              '3.1.research.domain.refs.v1.md',
            ],
            reviews: [
              {
                index: 1,
                cmd: 'reviewer/reflect',
                cached: false,
                durationSec: 5.0,
                blockers: 0,
                nitpicks: 0,
                path: '.route/3.1.research.domain.guard.review.i1.abc123.r1.md',
              },
            ],
            judges: [
              {
                index: 1,
                cmd: 'reviewed?',
                cached: false,
                durationSec: 0.3,
                passed: true,
                reason: null,
                path: '.route/3.1.research.domain.guard.judge.i1p1.abc123.def456.j1.md',
              },
            ],
          },
        });
        expect(result).toContain('3.1.research.domain._.v1.md');
        expect(result).toContain('3.1.research.domain.terms.v1.md');
        expect(result).toContain('3.1.research.domain.refs.v1.md');
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case8] review with nitpicks only — 0 blockers, 2 nitpicks', () => {
    when('[t0] called with nitpicks only', () => {
      then('output matches snapshot', () => {
        const result = formatGuardTree({
          stone: '1.vision',
          passage: 'allowed',
          note: null,
          reason: null,
          guard: {
            artifactFiles: ['1.vision.v1.md'],
            reviews: [
              {
                index: 1,
                cmd: 'reviewer/reflect',
                cached: false,
                durationSec: 7.0,
                blockers: 0,
                nitpicks: 2,
                path: '.route/1.vision.guard.review.i1.abc123.r1.md',
              },
            ],
            judges: [
              {
                index: 1,
                cmd: 'reviewed?',
                cached: false,
                durationSec: 0.3,
                passed: true,
                reason: null,
                path: '.route/1.vision.guard.judge.i1p1.abc123.def456.j1.md',
              },
            ],
          },
        });
        expect(result).not.toContain('blockers');
        expect(result).toContain('2 nitpicks 🟠');
        expect(result).toMatchSnapshot();
      });
    });
  });

  given(
    '[case9] review with both blockers and nitpicks — 3 blockers, 1 nitpick',
    () => {
      when('[t0] called with both', () => {
        then('output matches snapshot', () => {
          const result = formatGuardTree({
            stone: '1.vision',
            passage: 'blocked',
            note: null,
            reason: 'blockers exceed threshold (3 > 0)',
            guard: {
              artifactFiles: ['1.vision.v1.md'],
              reviews: [
                {
                  index: 1,
                  cmd: 'reviewer/reflect',
                  cached: false,
                  durationSec: 12.0,
                  blockers: 3,
                  nitpicks: 1,
                  path: '.route/1.vision.guard.review.i1.abc123.r1.md',
                },
              ],
              judges: [
                {
                  index: 1,
                  cmd: 'reviewed?',
                  cached: false,
                  durationSec: 0.4,
                  passed: false,
                  reason: 'blockers exceed threshold (3 > 0)',
                  path: '.route/1.vision.guard.judge.i1p1.abc123.def456.j1.md',
                },
              ],
            },
          });
          expect(result).toContain('3 blockers 🔴');
          expect(result).toContain('1 nitpick 🟠');
          expect(result).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case10] cached judge that had failed — shows cached, omits reason',
    () => {
      when('[t0] called with cached failed judge', () => {
        then('output matches snapshot', () => {
          const result = formatGuardTree({
            stone: '1.vision',
            passage: 'allowed',
            note: null,
            reason: null,
            guard: {
              artifactFiles: ['1.vision.v1.md'],
              reviews: [
                {
                  index: 1,
                  cmd: 'reviewer/reflect',
                  cached: true,
                  durationSec: null,
                  blockers: 0,
                  nitpicks: 0,
                  path: '.route/1.vision.guard.review.i1.abc123.r1.md',
                },
              ],
              judges: [
                {
                  index: 1,
                  cmd: 'reviewed?',
                  cached: true,
                  durationSec: null,
                  passed: false,
                  reason: 'blockers exceed threshold',
                  path: '.route/1.vision.guard.judge.i1p1.abc123.def456.j1.md',
                },
              ],
            },
          });
          expect(result).toContain('· cached');
          expect(result).not.toContain('reason:');
          expect(result).toMatchSnapshot();
        });
      });
    },
  );

  given('[case11] passage with reason — blocked + combined reasons', () => {
    when('[t0] called with blocked and reason', () => {
      then('output matches snapshot', () => {
        const result = formatGuardTree({
          stone: '1.vision',
          passage: 'blocked',
          note: null,
          reason: 'judge 1 failed; judge 2 failed',
          guard: {
            artifactFiles: ['1.vision.v1.md'],
            reviews: [
              {
                index: 1,
                cmd: 'reviewer/reflect',
                cached: false,
                durationSec: 5.0,
                blockers: 2,
                nitpicks: 0,
                path: '.route/1.vision.guard.review.i1.abc123.r1.md',
              },
            ],
            judges: [
              {
                index: 1,
                cmd: 'reviewed?',
                cached: false,
                durationSec: 0.3,
                passed: false,
                reason: 'judge 1 failed',
                path: '.route/1.vision.guard.judge.i1p1.abc123.def456.j1.md',
              },
              {
                index: 2,
                cmd: 'approved?',
                cached: false,
                durationSec: 0.2,
                passed: false,
                reason: 'judge 2 failed',
                path: '.route/1.vision.guard.judge.i1p1.abc123.def456.j2.md',
              },
            ],
          },
        });
        expect(result).toContain('passage = blocked');
        expect(result).toContain('reason = judge 1 failed; judge 2 failed');
        expect(result).toContain('reason: judge 1 failed');
        expect(result).toContain('reason: judge 2 failed');
        expect(result).toMatchSnapshot();
      });
    });
  });
});
