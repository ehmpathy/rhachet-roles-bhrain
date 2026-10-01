import { given, then, when } from 'test-fns';

import { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';

import { asReviewerBrains } from './asReviewerBrains';

/**
 * .what = pins the projection `case=9` [t4] renders — every peer reviewer beside the brain
 *         its own `run:` line asks for
 * .why = a direct unit test, so a regression here does not surface two layers down in the
 *        orchestrator suite (`rule.require.test-coverage-by-grain`)
 *
 * .note = PURE, so no temp dir and no clone
 * .note = a row with no brain carries its CAUSE; `case4` pins that
 */
const genGuard = (input: {
  peer?: { slug: string; run: string }[];
}): RouteStoneGuard =>
  new RouteStoneGuard({
    path: '.behavior/demo/1.vision.guard',
    artifacts: [],
    reviews: {
      peer: input.peer?.map((review) => ({
        slug: review.slug,
        run: review.run,
        budget: 11,
      })),
    },
    judges: [],
    protect: [],
  });

describe('asReviewerBrains', () => {
  given('[case1] a guard whose reviewers each declare a brain', () => {
    const guard = genGuard({
      peer: [
        { slug: 'repo-rules', run: `rhx review --repo bhrain --brain opus` },
        {
          slug: 'enroll-impl-arch-defects',
          run: `$rhx enroll claude --model 'claude-sonnet-5[1m]' --roles reviewer`,
        },
      ],
    });

    when('[t0] the guard is projected', () => {
      then('every reviewer appears, in declared order, with its brain', () => {
        // .why = guard order keeps the render stable beside the file a human edits
        expect(asReviewerBrains({ guard })).toEqual([
          { slug: 'repo-rules', brain: 'opus' },
          {
            slug: 'enroll-impl-arch-defects',
            brain: 'claude-sonnet-5[1m]',
          },
        ]);
      });
    });
  });

  given('[case2] a reviewer that declares NO brain', () => {
    const guard = genGuard({
      peer: [
        { slug: 'mech-failhides', run: `rhx review --repo bhrain --mode hard` },
      ],
    });

    when('[t0] the guard is projected', () => {
      then('its cause is `undeclared` — the row still appears', () => {
        // 🔴 .why = never drop the row: an omitted reviewer reads as one that will not run,
        //           a graver claim than "its tool's default" (`rule.forbid.failhide`)
        expect(asReviewerBrains({ guard })).toEqual([
          { slug: 'mech-failhides', brain: null, cause: 'undeclared' },
        ]);
      });
    });
  });

  given('[case4] a reviewer whose declaration cannot be READ', () => {
    /**
     * .why = a `--brain $(cat .brain)` resolves at run time to a REAL brain, so it must not
     *        share `case2`'s `null` + `(its tool's default)`, which would under-report the
     *        round's cost. drop the `cause` from the row and both go red
     */
    const guard = genGuard({
      peer: [
        { slug: 'quiet', run: `rhx review --repo bhrain` },
        { slug: 'hidden', run: `rhx review --brain $(cat .brain)` },
      ],
    });

    when('[t0] the guard is projected', () => {
      then('the two abstentions carry DIFFERENT causes', () => {
        expect(asReviewerBrains({ guard })).toEqual([
          { slug: 'quiet', brain: null, cause: 'undeclared' },
          { slug: 'hidden', brain: null, cause: 'unreadable' },
        ]);
      });
    });
  });

  given('[case3] a guard that declares no peer reviewers at all', () => {
    const CASES = [
      { peer: undefined, why: 'the `peer` key is absent' },
      { peer: [], why: 'the `peer` list is empty' },
    ];

    CASES.forEach((thisCase) => {
      when(`[t0] ${thisCase.why}`, () => {
        then('it returns an empty list, never a throw', () => {
          // .why = pins that the projection inherits `getGuardPeerReviews`'s `[]` default
          //        rather than read `.peer` raw
          expect(
            asReviewerBrains({ guard: genGuard({ peer: thisCase.peer }) }),
          ).toEqual([]);
        });
      });
    });
  });
});
