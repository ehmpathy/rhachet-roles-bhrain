import { given, then, when } from 'test-fns';

import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';
import { computeConcededBetterConcernCounts } from './getStoneConcededBetterConcernCounts';
import type { ReviewAbsorption } from './getStoneReviewAbsorptions';

const asGiven = (input: {
  slug: string;
  pathGiven: string;
}): RouteGuardReviewPeerGiven => ({
  slug: input.slug,
  blockers: 1,
  nitpicks: 1,
  unreadable: false,
  iteration: 1,
  pathGiven: input.pathGiven,
});

const asAbsorption = (input: {
  status: 'disputed' | 'conceded';
  reviewer: string;
  about: string;
  given: string;
  severity?: 'better' | 'urgent';
}): ReviewAbsorption => ({ ...input });

/**
 * .what = clamps that the `reviewed?` judge subtracts `better`-conceded concerns from its tally
 *         (S16), while it keeps `urgent`-conceded and never counts a dispute here
 * .why = a `better` concession is hard-capped by the budget: an all-`better` residual passes with
 *        NO budget increase and NO human. before this, the judge kept every concession, so a
 *        `better`-only exhaustion halted for budget — the exact mis-grade this shed corrects. this
 *        suite goes RED without the subtraction.
 */
describe('computeConcededBetterConcernCounts', () => {
  given('[case1] no absorptions at all', () => {
    when('[t0] the counts are computed', () => {
      then('naught is shed', () => {
        expect(
          computeConcededBetterConcernCounts({
            absorptions: [],
            givens: [asGiven({ slug: 'architect', pathGiven: 'g1' })],
          }),
        ).toEqual({ blockers: 0, nitpicks: 0 });
      });
    });
  });

  given('[case2] a `better`-graded concession against the latest given', () => {
    const givens = [asGiven({ slug: 'architect', pathGiven: 'g1' })];

    when('[t0] the concession is explicitly `better`', () => {
      then('the concern is shed', () => {
        expect(
          computeConcededBetterConcernCounts({
            absorptions: [
              asAbsorption({
                status: 'conceded',
                reviewer: 'architect',
                about: 'blocker.1',
                given: 'g1',
                severity: 'better',
              }),
            ],
            givens,
          }),
        ).toEqual({ blockers: 1, nitpicks: 0 });
      });
    });

    when('[t1] the concession is UNGRADED (severity absent)', () => {
      then(
        'it is read as `better` and shed — the maintenance-floor default',
        () => {
          expect(
            computeConcededBetterConcernCounts({
              absorptions: [
                asAbsorption({
                  status: 'conceded',
                  reviewer: 'architect',
                  about: 'nitpick.1',
                  given: 'g1',
                }),
              ],
              givens,
            }),
          ).toEqual({ blockers: 0, nitpicks: 1 });
        },
      );
    });
  });

  given(
    '[case3] an `urgent` concession — it ships harm, so it is NOT shed',
    () => {
      const givens = [asGiven({ slug: 'architect', pathGiven: 'g1' })];

      when('[t0] the counts are computed', () => {
        then('an urgent concession keeps the hold — naught shed', () => {
          expect(
            computeConcededBetterConcernCounts({
              absorptions: [
                asAbsorption({
                  status: 'conceded',
                  reviewer: 'architect',
                  about: 'blocker.1',
                  given: 'g1',
                  severity: 'urgent',
                }),
              ],
              givens,
            }),
          ).toEqual({ blockers: 0, nitpicks: 0 });
        });
      });
    },
  );

  given(
    '[case4] a DISPUTE — shed by the disputed count, never by this one',
    () => {
      const givens = [asGiven({ slug: 'architect', pathGiven: 'g1' })];

      when('[t0] the counts are computed', () => {
        then('a dispute is not a concession, so it is not counted here', () => {
          expect(
            computeConcededBetterConcernCounts({
              absorptions: [
                asAbsorption({
                  status: 'disputed',
                  reviewer: 'architect',
                  about: 'blocker.1',
                  given: 'g1',
                }),
              ],
              givens,
            }),
          ).toEqual({ blockers: 0, nitpicks: 0 });
        });
      });
    },
  );

  given('[case5] a concession against a STALE given — no longer live', () => {
    when('[t0] the stance keys to a prior generation', () => {
      then(
        'a stale concession is not shed — it keys to the latest given',
        () => {
          expect(
            computeConcededBetterConcernCounts({
              absorptions: [
                asAbsorption({
                  status: 'conceded',
                  reviewer: 'architect',
                  about: 'blocker.1',
                  given: 'g-old',
                  severity: 'better',
                }),
              ],
              givens: [asGiven({ slug: 'architect', pathGiven: 'g-new' })],
            }),
          ).toEqual({ blockers: 0, nitpicks: 0 });
        },
      );
    });
  });
});
