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
                  exitClass: 'passed',
                },
                {
                  index: 2,
                  cmd: 'reviewer/review',
                  cached: false,
                  durationSec: 15.1,
                  blockers: 3,
                  nitpicks: 1,
                  path: '.route/1.vision.guard.review.i1.abc123.r2.md',
                  exitClass: 'passed',
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
          expect(result).toContain('approved 8.2s'); // r1: 0 blockers → approved (no checkmark at end in new format)
          expect(result).toContain('rejected 15.1s'); // r2: 3 blockers → rejected
          expect(result).toContain('3 blockers 🔴'); // emoji after count
          expect(result).toContain('1 nitpick 🟠'); // emoji after count
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
                  exitClass: 'passed',
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
          expect(result).toContain('rejected 12.4s'); // 1 blocker → rejected
          expect(result).toContain('1 blocker 🔴'); // emoji after count
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
                  cached: { hit: true, on: ['1.vision.v1.md'] },
                  durationSec: null,
                  blockers: 0,
                  nitpicks: 0,
                  path: '.route/1.vision.guard.review.i1.abc123.r1.md',
                  exitClass: 'passed',
                },
                {
                  index: 2,
                  cmd: 'reviewer/review',
                  cached: false,
                  durationSec: 10.3,
                  blockers: 0,
                  nitpicks: 2,
                  path: '.route/1.vision.guard.review.i1.abc123.r2.md',
                  exitClass: 'passed',
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
          expect(result).toContain('approved, cached'); // new format: verdict + cached
          expect(result).toContain('rejected 10.3s'); // 2 nitpicks > allowNitpicks=0 → rejected
          expect(result).toContain('2 nitpicks 🟠'); // emoji after count
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
                cached: { hit: true, on: ['1.vision.v1.md'] },
                durationSec: null,
                blockers: 0,
                nitpicks: 0,
                path: '.route/1.vision.guard.review.i1.abc123.r1.md',
                exitClass: 'passed',
              },
            ],
            judges: [
              {
                index: 1,
                cmd: 'reviewed?',
                cached: { hit: true, on: ['1.vision.v1.md'] },
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
                exitClass: 'passed',
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
                exitClass: 'passed',
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
        expect(result).toContain('0 blockers ✓'); // emoji after count
        expect(result).toContain('2 nitpicks 🟠'); // emoji after count
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
                  exitClass: 'passed',
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
          expect(result).toContain('3 blockers 🔴'); // emoji after count
          expect(result).toContain('1 nitpick 🟠'); // emoji after count
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
                  cached: { hit: true, on: ['1.vision.v1.md'] },
                  durationSec: null,
                  blockers: 0,
                  nitpicks: 0,
                  path: '.route/1.vision.guard.review.i1.abc123.r1.md',
                  exitClass: 'passed',
                },
              ],
              judges: [
                {
                  index: 1,
                  cmd: 'reviewed?',
                  cached: { hit: true, on: ['1.vision.v1.md'] },
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
                exitClass: 'passed',
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

  given(
    '[case12] cached review on src/**/* artifacts — 5.1.execute stone with glob pattern',
    () => {
      when('[t0] called with cached review and glob pattern', () => {
        then('output contains glob pattern, not enumerated files', () => {
          const result = formatGuardTree({
            stone: '5.1.execute',
            passage: 'allowed',
            note: null,
            reason: null,
            guard: {
              // artifactFiles = expanded files (what matched the glob)
              artifactFiles: [
                'src/domain/execute.ts',
                'src/domain/execute.test.ts',
                'src/utils/helper.ts',
              ],
              reviews: [
                {
                  index: 1,
                  cmd: 'reviewer/review --rules ".agent/**/rules/*.md" --paths "src/**/*"',
                  // cached.on = original glob (what invalidates the cache)
                  cached: { hit: true, on: ['src/**/*'] },
                  durationSec: null,
                  blockers: 0,
                  nitpicks: 0,
                  path: '.route/5.1.execute.guard.review.i1.abc123.r1.md',
                  exitClass: 'passed',
                },
              ],
              judges: [
                {
                  index: 1,
                  cmd: 'reviewed?',
                  cached: { hit: true, on: ['src/**/*'] },
                  durationSec: null,
                  passed: true,
                  reason: null,
                  path: '.route/5.1.execute.guard.judge.i1p1.abc123.def456.j1.md',
                },
              ],
            },
          });
          expect(result).toContain('stone = 5.1.execute');
          expect(result).toContain('· cached');
          // glob pattern displayed, not individual files
          expect(result).toContain('on src/**/*');
          expect(result).not.toContain('on src/domain/execute.ts');
          expect(result).not.toContain('on src/domain/execute.test.ts');
          expect(result).not.toContain('on src/utils/helper.ts');
          expect(result).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case13] peerMeters — rNum uses meter order, not artifact order',
    () => {
      when('[t0] l2 reviewer ran but l1 reviewers did not', () => {
        then('rNum reflects declared position (r3 not r1)', () => {
          const result = formatGuardTree({
            stone: '5.5.playtest',
            passage: 'blocked',
            note: null,
            reason: 'wait for human approval',
            guard: {
              artifactFiles: ['5.5.playtest.yield.md'],
              reviews: [
                // only the l2 reviewer ran (index 3 in declaration)
                {
                  index: 3,
                  cmd: 'slow-fail',
                  cached: false,
                  durationSec: 15.0,
                  blockers: 0,
                  nitpicks: 0,
                  path: '.route/5.5.playtest.guard.review.i1.abc123.r3.md',
                  exitClass: 'passed',
                  peer: { slug: 'slow-fail', level: 2, rounds: 2, budget: 2 },
                },
              ],
              judges: [],
              peerMeters: [
                // l1 reviewers
                {
                  slug: 'quick-pass',
                  level: 1,
                  rounds: 1,
                  budget: 1,
                  verdict: 'exhausted',
                  awaits: false,
                  blockers: 0,
                  nitpicks: 0,
                  path: '.route/5.5.playtest.guard.review.i1.abc123.r1.md',
                },
                {
                  slug: 'medium-pass',
                  level: 1,
                  rounds: 0,
                  budget: 2,
                  verdict: 'queued',
                  awaits: false,
                  blockers: 0,
                  nitpicks: 0,
                  path: null,
                },
                // l2 reviewer
                {
                  slug: 'slow-fail',
                  level: 2,
                  rounds: 2,
                  budget: 2,
                  verdict: 'approved',
                  awaits: false,
                  blockers: 0,
                  nitpicks: 0,
                  path: '.route/5.5.playtest.guard.review.i1.abc123.r3.md',
                },
              ],
            },
          });
          // slow-fail should be r3 (its declared position), not r1 (artifact array index)
          expect(result).toContain('r1: quick-pass');
          expect(result).toContain('r2: medium-pass');
          expect(result).toContain('r3: slow-fail');
          expect(result).not.toMatch(/r1: slow-fail/);
          expect(result).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case14] peerMeters — exhausted reviewer shows prior review path',
    () => {
      when('[t0] reviewer exhausted with cached review', () => {
        then('shows review path not just exhausted', () => {
          const result = formatGuardTree({
            stone: '5.5.playtest',
            passage: 'blocked',
            note: null,
            reason: 'reviewer exhausted',
            guard: {
              artifactFiles: ['5.5.playtest.yield.md'],
              reviews: [
                {
                  index: 1,
                  cmd: 'quick-pass',
                  cached: { hit: true, on: ['5.5.playtest.yield.md'] },
                  durationSec: null,
                  blockers: 1,
                  nitpicks: 0,
                  path: '.route/5.5.playtest.guard.review.i1.abc123.r1.md',
                  exitClass: 'passed',
                  peer: { slug: 'quick-pass', level: 1, rounds: 1, budget: 1 },
                },
              ],
              judges: [],
              peerMeters: [
                {
                  slug: 'quick-pass',
                  level: 1,
                  rounds: 1,
                  budget: 1,
                  verdict: 'exhausted',
                  awaits: false,
                  blockers: 1,
                  nitpicks: 0,
                  path: '.route/5.5.playtest.guard.review.i1.abc123.r1.md',
                },
              ],
            },
          });
          // exhausted reviewer should show its review path
          expect(result).toContain('exhausted');
          expect(result).toContain(
            'review: .route/5.5.playtest.guard.review.i1.abc123.r1.md',
          );
          expect(result).toMatchSnapshot();
        });
      });
    },
  );

  given('[case15] peerMeters — awaits shown in header verdict', () => {
    when('[t0] l2 reviewer awaits l1', () => {
      then('header shows awaits not queued', () => {
        const result = formatGuardTree({
          stone: '5.5.playtest',
          passage: 'blocked',
          note: null,
          reason: 'blockers found',
          guard: {
            artifactFiles: ['5.5.playtest.yield.md'],
            reviews: [],
            judges: [],
            peerMeters: [
              {
                slug: 'cheapo',
                level: 1,
                rounds: 0,
                budget: 10,
                verdict: 'queued',
                awaits: false,
                blockers: 0,
                nitpicks: 0,
                path: null,
              },
              {
                slug: 'primo',
                level: 2,
                rounds: 0,
                budget: 3,
                verdict: 'queued',
                awaits: { level: 1 },
                blockers: 0,
                nitpicks: 0,
                path: null,
              },
            ],
          },
        });
        // verdict NOT in header per wish requirement
        expect(result).toContain('r1: cheapo (l1, 0/10)'); // no verdict in header
        expect(result).toContain('r2: primo (l2, 0/3)'); // no verdict in header
        // details show state
        expect(result).toContain('awaits arrival'); // l1 queued shows awaits arrival
        expect(result).toContain('awaits l1 terminal'); // l2 shows awaits l1
        expect(result).toMatchSnapshot();
      });
    });
  });

  given(
    '[case16] peerMeters — unique slugs via standardization shows correct individual data',
    () => {
      when(
        '[t0] reviewers have unique slugs (standardized at parse time)',
        () => {
          then('each reviewer shows its own blockers/path', () => {
            // slugs are now standardized at parse time: $rhx.1, $rhx.2, $rhx.3
            // .note = standardizePeerReviewSlugs adds .N suffix for collisions
            const result = formatGuardTree({
              stone: '5.3.verification',
              passage: 'blocked',
              note: null,
              reason: 'blockers exceed threshold',
              guard: {
                artifactFiles: ['$route/5.3.verification.yield.md'],
                reviews: [
                  {
                    index: 1,
                    cmd: '$rhx --rules briefs/r1.md',
                    cached: false,
                    durationSec: 43.7,
                    blockers: 1,
                    nitpicks: 0,
                    path: '.route/5.3.verification.guard.review.i3.abc123.r1.md',
                    exitClass: 'passed',
                    peer: {
                      slug: '$rhx.1',
                      level: 1,
                      rounds: 13,
                      budget: Infinity,
                    },
                  },
                  {
                    index: 2,
                    cmd: '$rhx --rules briefs/r2.md',
                    cached: false,
                    durationSec: 13.2,
                    blockers: 0,
                    nitpicks: 0,
                    path: '.route/5.3.verification.guard.review.i3.abc123.r2.md',
                    exitClass: 'passed',
                    peer: {
                      slug: '$rhx.2',
                      level: 1,
                      rounds: 14,
                      budget: Infinity,
                    },
                  },
                  {
                    index: 6,
                    cmd: '$rhx --rules briefs/r6.md',
                    cached: false,
                    durationSec: 14.9,
                    blockers: 0,
                    nitpicks: 0,
                    path: '.route/5.3.verification.guard.review.i3.abc123.r6.md',
                    exitClass: 'passed',
                    peer: {
                      slug: '$rhx.3',
                      level: 1,
                      rounds: 18,
                      budget: Infinity,
                    },
                  },
                ],
                judges: [],
                peerMeters: [
                  {
                    slug: '$rhx.1',
                    level: 1,
                    rounds: 13,
                    budget: Infinity,
                    verdict: 'rejected',
                    awaits: false,
                    blockers: 1,
                    nitpicks: 0,
                    path: '.route/5.3.verification.guard.review.i3.abc123.r1.md',
                  },
                  {
                    slug: '$rhx.2',
                    level: 1,
                    rounds: 14,
                    budget: Infinity,
                    verdict: 'approved',
                    awaits: false,
                    blockers: 0,
                    nitpicks: 0,
                    path: '.route/5.3.verification.guard.review.i3.abc123.r2.md',
                  },
                  {
                    slug: '$rhx.3',
                    level: 1,
                    rounds: 18,
                    budget: Infinity,
                    verdict: 'approved',
                    awaits: false,
                    blockers: 0,
                    nitpicks: 0,
                    path: '.route/5.3.verification.guard.review.i3.abc123.r6.md',
                  },
                ],
              },
            });
            // each reviewer shows its own data via unique slug lookup
            // .note = r labels use position in meters array (1-based)
            expect(result).toContain('r1: $rhx.1 (l1, 13/∞)'); // r1 has rounds=13
            expect(result).toContain('r2: $rhx.2 (l1, 14/∞)'); // r2 has rounds=14
            expect(result).toContain('r3: $rhx.3 (l1, 18/∞)'); // position=3, rounds=18
            // r1 shows its own blockers and path
            expect(result).toContain('1 blocker'); // r1 has 1 blocker
            expect(result).toContain('r1.md'); // r1 references r1.md
            // r2 and r6 show their own paths
            expect(result).toContain('r2.md'); // r2 references r2.md
            expect(result).toContain('r6.md'); // r6 references r6.md
            expect(result).toMatchSnapshot();
          });
        },
      );
    },
  );

  given('[case17] malfunction passage — offers overrule guidance', () => {
    when('[t0] a reviewer malfunctioned', () => {
      then('output offers overrule the malfunction option', () => {
        const result = formatGuardTree({
          stone: '1.feature',
          passage: 'malfunction',
          note: null,
          reason: 'reviewer or judge malfunctioned',
          guard: {
            artifactFiles: ['1.feature.md'],
            reviews: [
              {
                index: 1,
                cmd: 'basic-checker',
                cached: false,
                durationSec: 0.0,
                blockers: 0,
                nitpicks: 0,
                path: '.route/1.feature.guard.review.i1.abc123.r1.md',
                exitClass: 'malfunction',
              },
            ],
            judges: [],
          },
        });
        expect(result).toContain('passage = malfunction');
        expect(result).toContain('reason = reviewer or judge malfunctioned');
        // offers overrule guidance, just like exhausted offers budget options
        expect(result).toContain('overrule the malfunction');
        expect(result).toContain(
          'rhx route.stone.set --stone 1.feature --as overruled',
        );
        expect(result).toContain('or fix the reviewer, then retry');
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case18] constraint passage — offers overrule guidance', () => {
    when('[t0] a reviewer hit a constraint', () => {
      then('output offers overrule the constraint option', () => {
        const result = formatGuardTree({
          stone: '1.feature',
          passage: 'blocked',
          note: null,
          reason: 'reviewer constraint',
          guard: {
            artifactFiles: ['1.feature.md'],
            reviews: [
              {
                index: 1,
                cmd: 'basic-checker',
                cached: false,
                durationSec: 0.0,
                blockers: 0,
                nitpicks: 0,
                path: '.route/1.feature.guard.review.i1.abc123.r1.md',
                exitClass: 'constraint',
              },
            ],
            judges: [],
          },
        });
        expect(result).toContain('passage = blocked');
        expect(result).toContain('reason = reviewer constraint');
        expect(result).toContain('overrule the constraint');
        expect(result).toContain(
          'rhx route.stone.set --stone 1.feature --as overruled',
        );
        expect(result).toContain('or fix the reviewer, then retry');
        expect(result).toMatchSnapshot();
      });
    });
  });

  given(
    '[case19] malfunction passage, no guard — offers overrule guidance',
    () => {
      when('[t0] malfunction with no guard data', () => {
        then('output offers overrule the malfunction option', () => {
          const result = formatGuardTree({
            stone: '1.feature',
            passage: 'malfunction',
            note: null,
            reason: 'reviewer or judge malfunctioned',
            guard: null,
          });
          expect(result).toContain('passage = malfunction');
          expect(result).toContain('overrule the malfunction');
          expect(result).toContain(
            'rhx route.stone.set --stone 1.feature --as overruled',
          );
          expect(result).toMatchSnapshot();
        });
      });
    },
  );
});

describe('formatReviewsMeterLines', () => {
  given('[case1] unique slugs via standardization — slug-based lookup', () => {
    when(
      '[t0] reviewers have unique slugs (standardized at parse time)',
      () => {
        then(
          'each reviewer shows its own blockers/path via slug lookup',
          async () => {
            // dynamically import to access the exported function
            const { formatReviewsMeterLines } = await import(
              './formatGuardTree'
            );

            // slugs are standardized at parse time: $rhx.1, $rhx.2, $rhx.3
            // .note = standardizePeerReviewSlugs adds .N suffix for collisions
            const lines = formatReviewsMeterLines({
              meters: [
                {
                  slug: '$rhx.1',
                  level: 1,
                  rounds: 13,
                  budget: Infinity,
                  verdict: 'rejected',
                  awaits: false,
                  blockers: 1,
                  nitpicks: 0,
                  path: '.route/r1.md',
                },
                {
                  slug: '$rhx.2',
                  level: 1,
                  rounds: 14,
                  budget: Infinity,
                  verdict: 'approved',
                  awaits: false,
                  blockers: 0,
                  nitpicks: 0,
                  path: '.route/r2.md',
                },
                {
                  slug: '$rhx.3',
                  level: 1,
                  rounds: 18,
                  budget: Infinity,
                  verdict: 'approved',
                  awaits: false,
                  blockers: 0,
                  nitpicks: 0,
                  path: '.route/r6.md',
                },
              ],
              reviews: [
                {
                  artifact: {
                    index: 1,
                    path: '.route/r1.md',
                    blockers: 1,
                    nitpicks: 0,
                    exitClass: 'passed',
                  },
                  cmd: '$rhx --rules r1.md',
                  cached: false,
                  durationSec: 43.7,
                  peer: {
                    slug: '$rhx.1',
                    level: 1,
                    rounds: 13,
                    budget: Infinity,
                  },
                },
                {
                  artifact: {
                    index: 2,
                    path: '.route/r2.md',
                    blockers: 0,
                    nitpicks: 0,
                    exitClass: 'passed',
                  },
                  cmd: '$rhx --rules r2.md',
                  cached: false,
                  durationSec: 13.2,
                  peer: {
                    slug: '$rhx.2',
                    level: 1,
                    rounds: 14,
                    budget: Infinity,
                  },
                },
                {
                  artifact: {
                    index: 6,
                    path: '.route/r6.md',
                    blockers: 0,
                    nitpicks: 0,
                    exitClass: 'passed',
                  },
                  cmd: '$rhx --rules r6.md',
                  cached: false,
                  durationSec: 14.9,
                  peer: {
                    slug: '$rhx.3',
                    level: 1,
                    rounds: 18,
                    budget: Infinity,
                  },
                },
              ],
              includeHeader: false,
            });

            const output = lines.join('\n');
            // each reviewer shows its own blockers: r1=1, r2=0, r3(index 6)=0
            expect(output).toContain('1 blocker');
            // each reviewer shows its own path
            expect(output).toContain('r1.md');
            expect(output).toContain('r2.md');
            expect(output).toContain('r6.md');

            // verify r1 is rejected (has blocker), r2/r3 approved (no blockers)
            // count occurrences: should have 1 "rejected" and 2 "approved"
            const rejectedCount = (output.match(/rejected/g) || []).length;
            const approvedCount = (output.match(/approved/g) || []).length;
            expect(rejectedCount).toBe(1);
            expect(approvedCount).toBe(2);

            expect(lines).toMatchSnapshot();
          },
        );
      },
    );
  });
});
