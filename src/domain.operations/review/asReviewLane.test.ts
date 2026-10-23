import { asIsoPrice } from 'iso-price';
import { given, then, when } from 'test-fns';

import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import { getAllLaneOrdinals } from '@src/domain.operations/review/meter/getAllLaneOrdinals';

import { asReviewLane } from './asReviewLane';
import { asReviewLaneKey } from './asReviewLaneKey';
import { isSameReviewLane } from './isSameReviewLane';

const ROOT = '/tree/a/.log/bhrain/review';

/**
 * .what = one guard run of a slug, at a chosen stone and round
 * .why = the lane turns on the root, the slug, the head, the brain, and the round
 *        order alone
 */
const asRun = (input: {
  root?: string;
  slug: string;
  stone: string;
  iteration: number;
  head?: string;
  brain?: string | null;
}): ReviewRunMeter => ({
  dir: `${input.root ?? ROOT}/2026-09-26T0${input.iteration}-00-00Z.pid1.${input.slug}`,
  head: input.head ?? null,
  brain: input.brain ?? null,
  provider: null,
  identity: {
    route: '.behavior/v2026_09_20.review-cost-meter',
    stone: input.stone,
    iteration: input.iteration,
    hash: 'a1b2c3d',
    index: 1,
    slug: input.slug,
  },
  grade: 'metered',
  defect: null,
  scope: null,
  // a metered row carries measured figures; the lane ignores their values
  tokens: { input: 1_000, cacheSet: 0, cacheGet: 0, output: 10 },
  cost: { total: asIsoPrice('USD 0.01'), cacheSaved: null },
  prompt: null,
});

describe('asReviewLane', () => {
  given('[case1] a run with a guard identity', () => {
    when('[t0] its lane is read', () => {
      then(
        'the lane is its log root, its slug, its head, and its brain',
        () => {
          expect(
            asReviewLane({
              run: asRun({
                slug: 'repo-rules',
                stone: '5.1',
                iteration: 1,
                head: 'aaaa',
                brain: null,
              }),
            }),
          ).toEqual({
            root: ROOT,
            slug: 'repo-rules',
            head: 'aaaa',
            brain: null,
          });
        },
      );
    });
  });

  given('[case2] a run with no guard identity', () => {
    when('[t0] its lane is read', () => {
      then('it is in no lane', () => {
        expect(
          asReviewLane({
            run: { dir: `${ROOT}/x`, identity: null, head: null, brain: null },
          }),
        ).toBeNull();
      });
    });
  });

  given('[case3] 🔴 one slug that moves to the next stone', () => {
    const runs = [
      asRun({ slug: 'repo-rules', stone: '5.1.execution', iteration: 1 }),
      asRun({ slug: 'repo-rules', stone: '5.2.evaluation', iteration: 2 }),
    ];

    when('[t0] the two lanes are compared', () => {
      then(
        'they are one lane — the prefix is the rubric, never the stone',
        () => {
          expect(
            isSameReviewLane({
              a: asReviewLane({ run: runs[0]! }),
              b: asReviewLane({ run: runs[1]! }),
            }),
          ).toBe(true);
        },
      );
    });

    when('[t1] the lane ordinals are folded', () => {
      then(
        'the second stone run is the lane second run, never a cold first',
        () => {
          const ordinals = getAllLaneOrdinals({ runs });
          expect(ordinals.get(runs[0]!.dir)?.ordinal).toEqual(1);
          expect(ordinals.get(runs[1]!.dir)?.ordinal).toEqual(2);
        },
      );
    });
  });

  given('[case4] one slug in two worktrees', () => {
    const runs = [
      asRun({
        root: '/tree/a/.log',
        slug: 'repo-rules',
        stone: '5.1',
        iteration: 1,
      }),
      asRun({
        root: '/tree/b/.log',
        slug: 'repo-rules',
        stone: '5.1',
        iteration: 2,
      }),
    ];

    when('[t0] the lane ordinals are folded', () => {
      then('each tree counts its own lane from one', () => {
        const ordinals = getAllLaneOrdinals({ runs });
        expect(ordinals.get(runs[0]!.dir)?.ordinal).toEqual(1);
        expect(ordinals.get(runs[1]!.dir)?.ordinal).toEqual(1);
      });
    });
  });

  given(
    '[case5] 🔴 one slug whose prompt head changed between two runs',
    () => {
      // a rubric edit, a new brief, or a new focus: the system prompt differs, so
      // the cached prefix of the first run is no prefix of the second
      const runs = [
        asRun({ slug: 'repo-rules', stone: '5.1', iteration: 1, head: 'aaaa' }),
        asRun({ slug: 'repo-rules', stone: '5.1', iteration: 2, head: 'bbbb' }),
        asRun({ slug: 'repo-rules', stone: '5.1', iteration: 3, head: 'aaaa' }),
      ];

      when('[t0] the two lanes are compared', () => {
        then('they are two lanes, never one', () => {
          expect(
            isSameReviewLane({
              a: asReviewLane({ run: runs[0]! }),
              b: asReviewLane({ run: runs[1]! }),
            }),
          ).toBe(false);
        });

        then('the lane keys differ', () => {
          const keyOf = (run: ReviewRunMeter): string =>
            asReviewLaneKey({ lane: asReviewLane({ run })! });
          expect(keyOf(runs[0]!)).not.toEqual(keyOf(runs[1]!));
          expect(keyOf(runs[0]!)).toEqual(keyOf(runs[2]!));
        });
      });

      when('[t1] the lane ordinals are folded', () => {
        then(
          'the new head counts from one, and the old head resumes its count',
          () => {
            const ordinals = getAllLaneOrdinals({ runs });
            expect(ordinals.get(runs[0]!.dir)?.ordinal).toEqual(1);
            expect(ordinals.get(runs[1]!.dir)?.ordinal).toEqual(1);
            expect(ordinals.get(runs[2]!.dir)?.ordinal).toEqual(2);
          },
        );
      });
    },
  );

  given('[case6] 🔴 one slug and one head, on two brains', () => {
    // a cached prefix is the model plus the system prompt, and each brain's provider
    // holds its own cache — so a prefix one brain cached warms naught the other reads
    const runs = [
      asRun({
        slug: 'repo-rules',
        stone: '5.1',
        iteration: 1,
        head: 'aaaa',
        brain: 'openrouter/deepseek/flash/v4.1',
      }),
      asRun({
        slug: 'repo-rules',
        stone: '5.1',
        iteration: 2,
        head: 'aaaa',
        brain: 'anthropic/claude/sonnet/v5',
      }),
    ];

    when('[t0] the two lanes are compared', () => {
      then('they are two lanes, never one', () => {
        expect(
          isSameReviewLane({
            a: asReviewLane({ run: runs[0]! }),
            b: asReviewLane({ run: runs[1]! }),
          }),
        ).toBe(false);
      });
    });

    when('[t1] the lane ordinals are folded', () => {
      then('the new brain counts from one', () => {
        const ordinals = getAllLaneOrdinals({ runs });
        expect(ordinals.get(runs[1]!.dir)?.ordinal).toEqual(1);
      });
    });
  });
});
