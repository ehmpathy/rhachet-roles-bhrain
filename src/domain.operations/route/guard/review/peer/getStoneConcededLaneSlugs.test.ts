import { given, then, when } from 'test-fns';

import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';
import {
  computeConcededLaneSlugs,
  computeConcessionExhaustionKind,
} from './getStoneConcededLaneSlugs';
import type { ReviewAbsorption } from './getStoneReviewAbsorptions';

/**
 * .what = unit cases for the concession predicate the exhaustion halt reads
 * .why = it decides WHOSE halt an exhausted ladder is. a false positive words a human
 *        wait as a driver's own lever and strands the stone; a false negative sends a
 *        driver to a foreman for a command they hold. both are silent.
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

describe('computeConcededLaneSlugs', () => {
  given('[case1] an exhausted lane whose blocker the driver conceded', () => {
    const givens = [asGiven({ slug: 'mech', pathGiven: 'r3.mech.md' })];
    const absorptions = [
      asAbsorption({
        status: 'conceded',
        reviewer: 'mech',
        about: 'blocker.1',
        given: 'r3.mech.md',
      }),
    ];

    when('[t0] the halt asks whom it should name', () => {
      then('the lane is named', () => {
        expect(
          computeConcededLaneSlugs({ absorptions, givens, slugs: ['mech'] }),
        ).toEqual(['mech']);
      });
    });
  });

  given('[case2] an exhausted lane the driver never declared on', () => {
    const givens = [asGiven({ slug: 'mech', pathGiven: 'r3.mech.md' })];

    when('[t0] the halt asks', () => {
      then('no lane is named — it is an ordinary human wait', () => {
        expect(
          computeConcededLaneSlugs({
            absorptions: [],
            givens,
            slugs: ['mech'],
          }),
        ).toEqual([]);
      });
    });
  });

  given('[case3] an exhausted lane the driver DISPUTED', () => {
    const givens = [asGiven({ slug: 'mech', pathGiven: 'r3.mech.md' })];
    const absorptions = [
      asAbsorption({
        status: 'disputed',
        reviewer: 'mech',
        about: 'blocker.1',
        given: 'r3.mech.md',
      }),
    ];

    when('[t0] the halt asks', () => {
      then('no lane is named — a dispute buys the lane naught (S11)', () => {
        expect(
          computeConcededLaneSlugs({ absorptions, givens, slugs: ['mech'] }),
        ).toEqual([]);
      });
    });
  });

  given('[case4] a concession declared against a PRIOR given', () => {
    // the lane spoke again — its latest given is r4, the stance keys to r3
    const givens = [asGiven({ slug: 'mech', pathGiven: 'r4.mech.md' })];
    const absorptions = [
      asAbsorption({
        status: 'conceded',
        reviewer: 'mech',
        about: 'blocker.1',
        given: 'r3.mech.md',
      }),
    ];

    when('[t0] the halt asks', () => {
      then('no lane is named — the stance lapsed with the generation', () => {
        expect(
          computeConcededLaneSlugs({ absorptions, givens, slugs: ['mech'] }),
        ).toEqual([]);
      });
    });
  });

  given('[case5] two exhausted lanes, only one conceded', () => {
    const givens = [
      asGiven({ slug: 'mech', pathGiven: 'r3.mech.md' }),
      asGiven({ slug: 'arch', pathGiven: 'r3.arch.md' }),
    ];
    const absorptions = [
      asAbsorption({
        status: 'conceded',
        reviewer: 'mech',
        about: 'blocker.1',
        given: 'r3.mech.md',
      }),
    ];

    when('[t0] the halt asks', () => {
      then('only the conceded lane is named', () => {
        expect(
          computeConcededLaneSlugs({
            absorptions,
            givens,
            slugs: ['mech', 'arch'],
          }),
        ).toEqual(['mech']);
      });

      then('so the caller sees a PARTIAL set, never a whole one', () => {
        // the halt's condition is "every skipped lane conceded"; a partial set
        // means a lane still awaits a human, so the concession words must not fire
        const named = computeConcededLaneSlugs({
          absorptions,
          givens,
          slugs: ['mech', 'arch'],
        });
        expect(named.length).toBeLessThan(2);
      });
    });
  });

  given('[case6] a conceded lane that is NOT among the exhausted slugs', () => {
    // the driver conceded on a lane that still has budget — it is not this halt's business
    const givens = [
      asGiven({ slug: 'mech', pathGiven: 'r3.mech.md' }),
      asGiven({ slug: 'arch', pathGiven: 'r3.arch.md' }),
    ];
    const absorptions = [
      asAbsorption({
        status: 'conceded',
        reviewer: 'arch',
        about: 'blocker.1',
        given: 'r3.arch.md',
      }),
    ];

    when('[t0] the halt asks about the exhausted lane only', () => {
      then('the concession on the live lane is not named', () => {
        expect(
          computeConcededLaneSlugs({ absorptions, givens, slugs: ['mech'] }),
        ).toEqual([]);
      });
    });
  });

  given('[case7] one lane, one concede and one dispute on it', () => {
    // the commonest honest act: agree with one point, argue another (S07)
    const givens = [asGiven({ slug: 'mech', pathGiven: 'r3.mech.md' })];
    const absorptions = [
      asAbsorption({
        status: 'conceded',
        reviewer: 'mech',
        about: 'blocker.1',
        given: 'r3.mech.md',
      }),
      asAbsorption({
        status: 'disputed',
        reviewer: 'mech',
        about: 'blocker.2',
        given: 'r3.mech.md',
      }),
    ];

    when('[t0] the halt asks', () => {
      then('the lane IS named — one live concession suffices', () => {
        expect(
          computeConcededLaneSlugs({ absorptions, givens, slugs: ['mech'] }),
        ).toEqual(['mech']);
      });

      then('and it is named ONCE, never per stance', () => {
        expect(
          computeConcededLaneSlugs({ absorptions, givens, slugs: ['mech'] }),
        ).toHaveLength(1);
      });
    });
  });

  given('[case8] the caller names no exhausted lane at all', () => {
    when('[t0] the halt asks', () => {
      then('the answer is empty', () => {
        expect(
          computeConcededLaneSlugs({ absorptions: [], givens: [], slugs: [] }),
        ).toEqual([]);
      });
    });
  });
});

/**
 * .what = unit cases for the three-way severity classifier the exhaustion verdict reads
 * .why = it decides WHOSE budget lever an exhausted-and-conceded ladder names. `better` is the
 *        driver's own top-up (no human); `urgent` is a human's grant; `none` is an ordinary human
 *        wait. a false `better` strands harm as maintenance; a false `urgent` weighs the fleet down
 *        with a human summons the design already rendered
 *        (define.invariant.review.peer.budget.urgent-earns-budget).
 */
describe('computeConcessionExhaustionKind', () => {
  given('[case1] every skipped lane conceded, all better', () => {
    const givens = [asGiven({ slug: 'mech', pathGiven: 'r3.mech.md' })];
    const absorptions = [
      asAbsorption({
        status: 'conceded',
        reviewer: 'mech',
        about: 'blocker.1',
        given: 'r3.mech.md',
        severity: 'better',
      }),
    ];

    when('[t0] the verdict asks', () => {
      then('the kind is `better` — the driver tops up their own budget', () => {
        expect(
          computeConcessionExhaustionKind({
            absorptions,
            givens,
            slugs: ['mech'],
          }),
        ).toEqual('better');
      });
    });
  });

  given('[case2] a conceded lane with NO severity declared', () => {
    const givens = [asGiven({ slug: 'mech', pathGiven: 'r3.mech.md' })];
    const absorptions = [
      asAbsorption({
        status: 'conceded',
        reviewer: 'mech',
        about: 'blocker.1',
        given: 'r3.mech.md',
      }),
    ];

    when('[t0] the verdict asks', () => {
      then(
        'the kind is `better` — an ungraded concede is the maintenance floor',
        () => {
          expect(
            computeConcessionExhaustionKind({
              absorptions,
              givens,
              slugs: ['mech'],
            }),
          ).toEqual('better');
        },
      );
    });
  });

  given('[case3] a skipped lane carries an URGENT concession', () => {
    const givens = [
      asGiven({ slug: 'mech', pathGiven: 'r3.mech.md' }),
      asGiven({ slug: 'arch', pathGiven: 'r3.arch.md' }),
    ];
    const absorptions = [
      asAbsorption({
        status: 'conceded',
        reviewer: 'mech',
        about: 'blocker.1',
        given: 'r3.mech.md',
        severity: 'better',
      }),
      asAbsorption({
        status: 'conceded',
        reviewer: 'arch',
        about: 'blocker.1',
        given: 'r3.arch.md',
        severity: 'urgent',
      }),
    ];

    when('[t0] the verdict asks', () => {
      then(
        'the kind is `urgent` — one urgent among many earns a human grant',
        () => {
          expect(
            computeConcessionExhaustionKind({
              absorptions,
              givens,
              slugs: ['mech', 'arch'],
            }),
          ).toEqual('urgent');
        },
      );
    });
  });

  given('[case4] a lane the driver never conceded', () => {
    const givens = [
      asGiven({ slug: 'mech', pathGiven: 'r3.mech.md' }),
      asGiven({ slug: 'arch', pathGiven: 'r3.arch.md' }),
    ];
    const absorptions = [
      asAbsorption({
        status: 'conceded',
        reviewer: 'mech',
        about: 'blocker.1',
        given: 'r3.mech.md',
        severity: 'urgent',
      }),
    ];

    when('[t0] the verdict asks about BOTH skipped lanes', () => {
      then(
        'the kind is `none` — a lane never conceded still awaits a human',
        () => {
          // arch has no stance, so not every skipped lane conceded — the concession
          // words must not fire, urgent or otherwise
          expect(
            computeConcessionExhaustionKind({
              absorptions,
              givens,
              slugs: ['mech', 'arch'],
            }),
          ).toEqual('none');
        },
      );
    });
  });

  given(
    '[case5] the urgent stance is on a lane NOT among the skipped set',
    () => {
      const givens = [
        asGiven({ slug: 'mech', pathGiven: 'r3.mech.md' }),
        asGiven({ slug: 'arch', pathGiven: 'r3.arch.md' }),
      ];
      const absorptions = [
        asAbsorption({
          status: 'conceded',
          reviewer: 'mech',
          about: 'blocker.1',
          given: 'r3.mech.md',
          severity: 'better',
        }),
        asAbsorption({
          status: 'conceded',
          reviewer: 'arch',
          about: 'blocker.1',
          given: 'r3.arch.md',
          severity: 'urgent',
        }),
      ];

      when('[t0] the verdict asks about the mech lane only', () => {
        then(
          'the kind is `better` — an urgent on a live lane is not this halt`s',
          () => {
            expect(
              computeConcessionExhaustionKind({
                absorptions,
                givens,
                slugs: ['mech'],
              }),
            ).toEqual('better');
          },
        );
      });
    },
  );

  given(
    '[case6] a DISPUTED lane with an urgent severity set does not count',
    () => {
      // severity attaches to a concede; a dispute buys the lane naught (S11)
      const givens = [asGiven({ slug: 'mech', pathGiven: 'r3.mech.md' })];
      const absorptions = [
        asAbsorption({
          status: 'disputed',
          reviewer: 'mech',
          about: 'blocker.1',
          given: 'r3.mech.md',
        }),
      ];

      when('[t0] the verdict asks', () => {
        then(
          'the kind is `none` — a dispute is not a concession of any severity',
          () => {
            expect(
              computeConcessionExhaustionKind({
                absorptions,
                givens,
                slugs: ['mech'],
              }),
            ).toEqual('none');
          },
        );
      });
    },
  );

  given('[case7] an urgent concession against a PRIOR given', () => {
    // the lane spoke again — its latest given is r4, the urgent stance keys to r3
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

    when('[t0] the verdict asks', () => {
      then(
        'the kind is `none` — the urgent stance lapsed with the generation',
        () => {
          expect(
            computeConcessionExhaustionKind({
              absorptions,
              givens,
              slugs: ['mech'],
            }),
          ).toEqual('none');
        },
      );
    });
  });

  given('[case8] no skipped lane at all', () => {
    when('[t0] the verdict asks', () => {
      then('the kind is `none`', () => {
        expect(
          computeConcessionExhaustionKind({
            absorptions: [],
            givens: [],
            slugs: [],
          }),
        ).toEqual('none');
      });
    });
  });
});
