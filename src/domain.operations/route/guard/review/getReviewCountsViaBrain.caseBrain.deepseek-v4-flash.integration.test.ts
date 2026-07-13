import type { BrainChoice, ContextBrain } from 'rhachet';
import { given, then, useThen, when } from 'test-fns';

import {
  DEFAULT_TEST_BRAIN,
  genTestBrainContext,
} from '@src/.test/genTestBrainContext';
import { REPEATABLY_CONFIG } from '@src/.test/infra/repeatably';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ContextReviewBrainSupply } from '../../genReviewBrainSupply';
import { getReviewCountsViaBrain } from './getReviewCountsViaBrain';

/**
 * .what = boundary tests for the probabilistic tactic against the REAL deepseek-v4-flash brain
 * .why = the deterministic parser cannot read a prose verdict; this leaf must. per
 *        rule.forbid.integration.mocks the tests hit the real model (no mocks), and per
 *        rule.require.repeatable-for-llm-tests every real-brain case is wrapped in
 *        when.repeatably. two fixture classes:
 *          - SYNTHETIC unambiguous cases → exact-pinned counts (the tally is not debatable)
 *          - REAL malfunctioned reviews (the L3 enroll-* reviews that failed on THIS stone) →
 *            the robust rescue invariant (detected=true + blockers>=1). their exact per-item
 *            tally is a flagged wisher judgment (mixed 🔴/🟠/🟡 + [confirmed]/[new] severities),
 *            so we assert the property the wish actually needs — the review is rescued from
 *            malfunction — not a brittle exact count on genuinely-ambiguous human severity calls.
 */

// increase timeout for brain invocations (3 minutes)
jest.setTimeout(180000);

// a real-brain supplier for the probabilistic path (memoize-on-success, like prod)
const genRealSupply = (): ContextReviewBrainSupply => {
  let cached: ContextBrain<BrainChoice> | null = null;
  return {
    getReviewBrain: async () => {
      if (cached) return cached;
      cached = genTestBrainContext({ brain: DEFAULT_TEST_BRAIN });
      return cached;
    },
  };
};

/**
 * .what = extracts the reviewer's raw stdout body from a persisted guard-review artifact
 * .why = the persisted `.md` wraps the review in a treestruct (├─ stdout … ├─ stderr …) whose
 *        stderr carries the `💥 malfunction` note. the sub-brain must tally the review BODY, not
 *        the wrapper's malfunction verdict — so we strip the wrapper and hand over only the prose.
 */
const extractReviewBody = (raw: string): string => {
  const lines = raw.split('\n');
  const startIdx = lines.findIndex((l) => l.trim() === '├─ stdout');
  const endIdx = lines.findIndex((l) => l.trim() === '├─ stderr');
  return lines
    .slice(startIdx + 1, endIdx === -1 ? undefined : endIdx)
    .filter((l) => !/^\s*│\s+[├└]─\s*$/.test(l)) // drop the stdout open/close markers
    .map((l) => l.replace(/^│ {2}│ {0,2}/, '')) // strip the `│  │  ` body prefix
    .join('\n')
    .trim();
};

const loadFixture = (name: string): string =>
  extractReviewBody(
    readFileSync(join(__dirname, '__test_assets__/reviews', name), 'utf-8'),
  );

describe('getReviewCountsViaBrain', () => {
  // ── synthetic, unambiguous cases (exact-pinned) ──────────────────────────

  given('[case1] empty content — no verdict at all', () => {
    when.repeatably(REPEATABLY_CONFIG)('[t0] tallied by the real brain', () => {
      const result = useThen('it succeeds', async () =>
        getReviewCountsViaBrain({ content: '' }, genRealSupply()),
      );

      then('it returns detected=false (no fabricated verdict)', () => {
        expect(result.detected).toBe(false);
      });
    });
  });

  given('[case2] garbage content — no discernible verdict', () => {
    const content = 'asdf qwer zxcv lorem ipsum dolor sit amet consectetur';

    when.repeatably(REPEATABLY_CONFIG)('[t0] tallied by the real brain', () => {
      const result = useThen('it succeeds', async () =>
        getReviewCountsViaBrain({ content }, genRealSupply()),
      );

      then('it returns detected=false', () => {
        expect(result.detected).toBe(false);
      });
    });
  });

  given(
    '[case3] terse-but-genuine clean pass — the evidence-gate false-negative fence',
    () => {
      const content = 'lgtm — looks good, no issues, ship it';

      when.repeatably(REPEATABLY_CONFIG)(
        '[t0] tallied by the real brain',
        () => {
          const result = useThen('it succeeds', async () =>
            getReviewCountsViaBrain({ content }, genRealSupply()),
          );

          then('it returns a DECLARED clean pass (detected=true, 0/0)', () => {
            // the evidence-gate must NOT over-reject a genuine terse verdict into a spurious
            // malfunction — the exact failure mode this wish exists to remove, one layer down.
            expect(result.detected).toBe(true);
            if (!result.detected) throw new Error('expected detected');
            expect(result.blockers).toBe(0);
            expect(result.nitpicks).toBe(0);
          });
        },
      );
    },
  );

  given('[case4] clean prose — reviewer reports no issues', () => {
    const content =
      'i reviewed the change carefully. everything looks correct, well-tested, and clear. no problems to report.';

    when.repeatably(REPEATABLY_CONFIG)('[t0] tallied by the real brain', () => {
      const result = useThen('it succeeds', async () =>
        getReviewCountsViaBrain({ content }, genRealSupply()),
      );

      then('it returns detected=true with 0 blockers, 0 nitpicks', () => {
        expect(result.detected).toBe(true);
        if (!result.detected) throw new Error('expected detected');
        expect(result.blockers).toBe(0);
        expect(result.nitpicks).toBe(0);
      });
    });
  });

  given('[case5] prose with genuine must-fix + optional items', () => {
    const content = `## summary

i found two must-fix problems that block the change, and one optional
suggestion to clean up later. the two problems must be resolved; the
suggestion is advisory only.`;

    when.repeatably(REPEATABLY_CONFIG)('[t0] tallied by the real brain', () => {
      const result = useThen('it succeeds', async () =>
        getReviewCountsViaBrain({ content }, genRealSupply()),
      );

      then('it returns 2 blockers, 1 nitpick from the prose', () => {
        expect(result.detected).toBe(true);
        if (!result.detected) throw new Error('expected detected');
        expect(result.blockers).toBe(2);
        expect(result.nitpicks).toBe(1);
      });
    });
  });

  given('[case6] mentioned-then-cleared — final verdict is clean', () => {
    const content = `## review

at first i worried about two potential blockers around error handling and
a race condition. after tracing the code, both are already handled correctly.
final verdict: no outstanding issues. 0 blockers, 0 nitpicks.`;

    when.repeatably(REPEATABLY_CONFIG)('[t0] tallied by the real brain', () => {
      const result = useThen('it succeeds', async () =>
        getReviewCountsViaBrain({ content }, genRealSupply()),
      );

      then(
        'it returns the FINAL 0/0, not the mentioned-in-passing numbers',
        () => {
          expect(result.detected).toBe(true);
          if (!result.detected) throw new Error('expected detected');
          expect(result.blockers).toBe(0);
          expect(result.nitpicks).toBe(0);
        },
      );
    });
  });

  given(
    '[case7] partial-numeric — one dimension numeric, the other prose',
    () => {
      const content = `## findings

0 blockers — the change is safe to merge.

but a couple of small style points are worth a cleanup: the variable names
could be clearer, and one comment is stale. both are optional.`;

      when.repeatably(REPEATABLY_CONFIG)(
        '[t0] tallied by the real brain',
        () => {
          const result = useThen('it succeeds', async () =>
            getReviewCountsViaBrain({ content }, genRealSupply()),
          );

          then(
            'it resolves the whole tally (0 blockers, nitpicks from prose)',
            () => {
              expect(result.detected).toBe(true);
              if (!result.detected) throw new Error('expected detected');
              expect(result.blockers).toBe(0);
              expect(result.nitpicks).toBeGreaterThanOrEqual(1);
            },
          );
        },
      );
    },
  );

  given(
    '[case8] rubric-taxonomy — headed severity sections, no numeric line',
    () => {
      // shaped like this repo's own architect-role reviewers: headed markdown sections,
      // inline severity marks, and NO `N blockers` line anywhere.
      const content = `Reviewed against the code. Findings below.

## Blockers

**1.** The change won't compile — a required import is absent. 🔴 MUST fix.

## Maintenance hazards

**2.** The fallback has no timeout; a hang would regress a bounded guarantee. 🔴 must bound this.

## Worth surfacing

**3.** Consider collapsing the duplicated shape later — advisory, not blocking. 🟡`;

      when.repeatably(REPEATABLY_CONFIG)(
        '[t0] tallied by the real brain',
        () => {
          const result = useThen('it succeeds', async () =>
            getReviewCountsViaBrain({ content }, genRealSupply()),
          );

          then(
            'must-fix items count as blockers regardless of the section title',
            () => {
              expect(result.detected).toBe(true);
              if (!result.detected) throw new Error('expected detected');
              // items 1 & 2 are framed must-fix (🔴) → blockers; item 3 is advisory (🟡) →
              // nitpick. the "Maintenance hazards" heading must NOT downgrade a must-fix item.
              expect(result.blockers).toBeGreaterThanOrEqual(2);
              expect(result.nitpicks).toBeGreaterThanOrEqual(1);
            },
          );
        },
      );
    },
  );

  given(
    '[case9] large review about a small subject — reads the review, not the subject',
    () => {
      const content = `## review of a 10,000-line refactor

despite the size of the change, my review is short: i traced the three risky
call sites and all three are correct. one must-fix: the migration step lacks
a rollback path. otherwise clean.`;

      when.repeatably(REPEATABLY_CONFIG)(
        '[t0] tallied by the real brain',
        () => {
          const result = useThen('it succeeds', async () =>
            getReviewCountsViaBrain({ content }, genRealSupply()),
          );

          then('the tally comes from the review text (1 blocker)', () => {
            expect(result.detected).toBe(true);
            if (!result.detected) throw new Error('expected detected');
            expect(result.blockers).toBeGreaterThanOrEqual(1);
          });
        },
      );
    },
  );

  // ── REAL malfunctioned reviews from THIS stone (regression fixtures) ──────
  // the exact per-item tally is a flagged wisher judgment (mixed severities); we assert the
  // robust rescue invariant: these reviews — which the guard promoted to 💥 malfunction — are
  // now read as real verdicts with at least one blocker, so the stone gates on substance.

  const REAL_FIXTURES = [
    'enroll-arch-defects.i2.md',
    'enroll-arch-defects.i4.md',
    'enroll-behavior-intent.i2.md',
    'enroll-behavior-intent.i4.md',
  ];

  for (const fixture of REAL_FIXTURES) {
    given(
      `[real:${fixture}] a real L3 reviewer that malfunctioned on this stone`,
      () => {
        const content = loadFixture(fixture);

        when.repeatably(REPEATABLY_CONFIG)(
          '[t0] tallied by the real brain',
          () => {
            const result = useThen('it succeeds', async () =>
              getReviewCountsViaBrain({ content }, genRealSupply()),
            );

            then(
              'the review is rescued — detected=true with at least one blocker',
              () => {
                expect(result.detected).toBe(true);
                if (!result.detected) throw new Error('expected detected');
                expect(result.blockers).toBeGreaterThanOrEqual(1);
              },
            );
          },
        );
      },
    );
  }
});
