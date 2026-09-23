import { given, then, when } from 'test-fns';

import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';
import { computeLiveUrgentConcessionSlugs } from './getStoneLiveUrgentConcessionSlugs';
import type { ReviewAbsorption } from './getStoneReviewAbsorptions';

/**
 * .what = unit cases for the WARRANT the budget gate reads
 * .why = 🔴 this predicate is the first of the three conjuncts that lift a refused grant
 *        (`computeBudgetGrantRefusal`). a false positive mints a round the driver never earned,
 *        which is the very lever the behavior exists to bound; a false negative refuses a driver
 *        that DID name a shipped harm and sends it to a human for a round it holds.
 *
 * 🔴 [case3] is the clamp the vision named: the gate must FAIL CLOSED on an ungraded row. it is a
 *    unit test rather than a reviewer's eye, because `severity === 'urgent'` and
 *    `severity !== 'better'` state one intent in a diff and behave oppositely on the legacy corpus.
 */

const asGiven = (input: {
  slug: string;
  pathGiven: string;
}): RouteGuardReviewPeerGiven =>
  ({
    slug: input.slug,
    pathGiven: input.pathGiven,
    blockers: 1,
    nitpicks: 0,
    unreadable: false,
  }) as RouteGuardReviewPeerGiven;

const asAbsorption = (input: {
  status: 'conceded' | 'disputed';
  reviewer: string;
  about: string;
  given: string;
  severity?: 'better' | 'urgent';
}): ReviewAbsorption => ({ ...input });

describe('computeLiveUrgentConcessionSlugs', () => {
  given('[case1] a live concession graded urgent', () => {
    const givens = [asGiven({ slug: 'mech', pathGiven: 'r3.mech.md' })];
    const absorptions = [
      asAbsorption({
        status: 'conceded',
        reviewer: 'mech',
        about: 'blocker.1',
        given: 'r3.mech.md',
        severity: 'urgent',
      }),
    ];

    when('[t0] the gate asks whether a warrant stands', () => {
      then('the lane is named', () => {
        expect(
          computeLiveUrgentConcessionSlugs({ absorptions, givens }),
        ).toEqual(['mech']);
      });
    });
  });

  given('[case2] a live concession graded better', () => {
    const givens = [asGiven({ slug: 'mech', pathGiven: 'r3.mech.md' })];
    const absorptions = [
      asAbsorption({
        status: 'conceded',
        reviewer: 'mech',
        about: 'nitpick.1',
        given: 'r3.mech.md',
        severity: 'better',
      }),
    ];

    when('[t0] the gate asks whether a warrant stands', () => {
      // `better` never earns a round past the meter — the remedy is the fix the driver
      // already named (`define.invariant.review.peer.budget.urgent-earns-budget`; F04)
      then('no lane is named', () => {
        expect(
          computeLiveUrgentConcessionSlugs({ absorptions, givens }),
        ).toEqual([]);
      });
    });
  });

  given('[case3] a LEGACY row, conceded with no severity at all', () => {
    // 🔴 the clamp. `PassageReport.severity` is optional, so a row written before the field
    //    existed carries none — and it must NOT mint a warrant.
    const givens = [asGiven({ slug: 'mech', pathGiven: 'r3.mech.md' })];
    const absorptions = [
      asAbsorption({
        status: 'conceded',
        reviewer: 'mech',
        about: 'blocker.1',
        given: 'r3.mech.md',
      }),
    ];

    when('[t0] the gate asks whether a warrant stands', () => {
      then('no lane is named — the gate fails CLOSED', () => {
        expect(
          computeLiveUrgentConcessionSlugs({ absorptions, givens }),
        ).toEqual([]);
      });

      // ⚠️ the guard against a `severity !== 'better'` refactor. that form reads as the same
      //    intent and would return ['mech'] here, so it is asserted rather than assumed.
      then('an ungraded row is NOT read as urgent', () => {
        expect(
          computeLiveUrgentConcessionSlugs({ absorptions, givens }),
        ).not.toContain('mech');
      });
    });
  });

  given('[case4] a DISPUTE that carries an urgent severity', () => {
    // `--severity` is forbidden on a dispute at the command (`setStoneAsConcernAbsorbed`), so
    // this row cannot be minted today. it is pinned because a dispute sheds the concern from
    // the tally rather than a claim that a round is warranted — a warrant from one would be a
    // grant the driver argued it did not need.
    const givens = [asGiven({ slug: 'mech', pathGiven: 'r3.mech.md' })];
    const absorptions = [
      asAbsorption({
        status: 'disputed',
        reviewer: 'mech',
        about: 'blocker.1',
        given: 'r3.mech.md',
        severity: 'urgent',
      }),
    ];

    when('[t0] the gate asks whether a warrant stands', () => {
      then('no lane is named', () => {
        expect(
          computeLiveUrgentConcessionSlugs({ absorptions, givens }),
        ).toEqual([]);
      });
    });
  });

  given('[case5] an urgent concession declared against a PRIOR given', () => {
    // the lane spoke again, so the stance answers a question no longer asked (S03's
    // per-generation lapse). the freshness rule is `getLiveReviewAbsorptions`, never a
    // filter spelled here — this pins that the warrant inherits it.
    const givens = [asGiven({ slug: 'mech', pathGiven: 'r4.mech.md' })];
    const absorptions = [
      asAbsorption({
        status: 'conceded',
        reviewer: 'mech',
        about: 'blocker.1',
        given: 'r3.mech.md',
        severity: 'urgent',
      }),
    ];

    when('[t0] the gate asks whether a warrant stands', () => {
      then('no lane is named — the stance has lapsed', () => {
        expect(
          computeLiveUrgentConcessionSlugs({ absorptions, givens }),
        ).toEqual([]);
      });
    });
  });

  given(
    '[case6] one reviewer with two urgent concessions, and a peer with none',
    () => {
      const givens = [
        asGiven({ slug: 'mech', pathGiven: 'r3.mech.md' }),
        asGiven({ slug: 'ergo', pathGiven: 'r3.ergo.md' }),
      ];
      const absorptions = [
        asAbsorption({
          status: 'conceded',
          reviewer: 'mech',
          about: 'blocker.1',
          given: 'r3.mech.md',
          severity: 'urgent',
        }),
        asAbsorption({
          status: 'conceded',
          reviewer: 'mech',
          about: 'blocker.2',
          given: 'r3.mech.md',
          severity: 'urgent',
        }),
        asAbsorption({
          status: 'conceded',
          reviewer: 'ergo',
          about: 'nitpick.1',
          given: 'r3.ergo.md',
          severity: 'better',
        }),
      ];

      when('[t0] the gate asks whether a warrant stands', () => {
        then('the urgent lane is named exactly once', () => {
          expect(
            computeLiveUrgentConcessionSlugs({ absorptions, givens }),
          ).toEqual(['mech']);
        });
      });
    },
  );
});
