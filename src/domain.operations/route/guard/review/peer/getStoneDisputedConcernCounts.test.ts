import { given, then, when } from 'test-fns';

import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';
import { computeDisputedConcernCounts } from './getStoneDisputedConcernCounts';
import type { ReviewAbsorption } from './getStoneReviewAbsorptions';

const asGiven = (input: {
  slug: string;
  pathGiven: string;
}): RouteGuardReviewPeerGiven => ({
  slug: input.slug,
  blockers: 1,
  nitpicks: 0,
  unreadable: false,
  iteration: 1,
  pathGiven: input.pathGiven,
});

const asAbsorption = (input: {
  status: 'disputed' | 'conceded';
  reviewer: string;
  about: string;
  given: string;
}): ReviewAbsorption => ({ ...input });

describe('computeDisputedConcernCounts', () => {
  given('[case1] no absorptions at all', () => {
    when('[t0] the counts are computed', () => {
      then('naught is excluded', () => {
        expect(
          computeDisputedConcernCounts({
            absorptions: [],
            givens: [asGiven({ slug: 'architect', pathGiven: 'g1' })],
          }),
        ).toEqual({ blockers: 0, nitpicks: 0 });
      });
    });
  });

  given('[case2] one dispute against the latest given', () => {
    const absorptions = [
      asAbsorption({
        status: 'disputed',
        reviewer: 'architect',
        about: 'blocker.1',
        given: 'g1',
      }),
    ];
    const givens = [asGiven({ slug: 'architect', pathGiven: 'g1' })];

    when('[t0] the counts are computed', () => {
      then('exactly one blocker is excluded', () => {
        expect(computeDisputedConcernCounts({ absorptions, givens })).toEqual({
          blockers: 1,
          nitpicks: 0,
        });
      });
    });
  });

  given('[case3] a concede beside a dispute, on the same lane', () => {
    // 🔴 the case rule.forbid.suppression-of-undeclared-concerns exists for: a lane-grain
    //    exclusion would shed the concessions too, and the stone would pass dirty
    const absorptions = [
      asAbsorption({
        status: 'disputed',
        reviewer: 'architect',
        about: 'nitpick.1',
        given: 'g1',
      }),
      asAbsorption({
        status: 'conceded',
        reviewer: 'architect',
        about: 'nitpick.2',
        given: 'g1',
      }),
      asAbsorption({
        status: 'conceded',
        reviewer: 'architect',
        about: 'nitpick.3',
        given: 'g1',
      }),
    ];
    const givens = [asGiven({ slug: 'architect', pathGiven: 'g1' })];

    when('[t0] the counts are computed', () => {
      then('only the DISPUTED one leaves the tally', () => {
        expect(computeDisputedConcernCounts({ absorptions, givens })).toEqual({
          blockers: 0,
          nitpicks: 1,
        });
      });
    });
  });

  given('[case4] a dispute declared against a PRIOR given', () => {
    // S03 — the lane spoke again, so the stance lapsed and the driver re-declares
    const absorptions = [
      asAbsorption({
        status: 'disputed',
        reviewer: 'architect',
        about: 'blocker.1',
        given: 'g1',
      }),
    ];
    const givens = [asGiven({ slug: 'architect', pathGiven: 'g2' })];

    when('[t0] the counts are computed', () => {
      then('the lapsed stance excludes naught', () => {
        expect(computeDisputedConcernCounts({ absorptions, givens })).toEqual({
          blockers: 0,
          nitpicks: 0,
        });
      });
    });
  });

  given('[case5] disputes across two lanes', () => {
    const absorptions = [
      asAbsorption({
        status: 'disputed',
        reviewer: 'architect',
        about: 'blocker.1',
        given: 'g-arch',
      }),
      asAbsorption({
        status: 'disputed',
        reviewer: 'mechanic',
        about: 'nitpick.4',
        given: 'g-mech',
      }),
    ];
    const givens = [
      asGiven({ slug: 'architect', pathGiven: 'g-arch' }),
      asGiven({ slug: 'mechanic', pathGiven: 'g-mech' }),
    ];

    when('[t0] the counts are computed', () => {
      then('both are excluded, each by its own severity', () => {
        expect(computeDisputedConcernCounts({ absorptions, givens })).toEqual({
          blockers: 1,
          nitpicks: 1,
        });
      });
    });
  });

  given('[case6] a dispute on a lane with no given at all', () => {
    const absorptions = [
      asAbsorption({
        status: 'disputed',
        reviewer: 'retired',
        about: 'blocker.1',
        given: 'g-old',
      }),
    ];

    when('[t0] the counts are computed', () => {
      then('it excludes naught — no latest given to match', () => {
        expect(
          computeDisputedConcernCounts({ absorptions, givens: [] }),
        ).toEqual({
          blockers: 0,
          nitpicks: 0,
        });
      });
    });
  });
});
