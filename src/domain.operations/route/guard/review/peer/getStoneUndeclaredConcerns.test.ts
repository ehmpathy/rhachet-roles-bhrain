import { given, then, when } from 'test-fns';

import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';
import type { ReviewAbsorption } from './getStoneReviewAbsorptions';
import { computeUndeclaredConcerns } from './getStoneUndeclaredConcerns';

const asGiven = (input: {
  slug: string;
  blockers: number;
  nitpicks: number;
  pathGiven?: string;
  unreadable?: boolean;
}): RouteGuardReviewPeerGiven => ({
  slug: input.slug,
  blockers: input.blockers,
  nitpicks: input.nitpicks,
  unreadable: input.unreadable ?? false,
  iteration: 1,
  pathGiven: input.pathGiven ?? 'g1',
});

const asAbsorption = (input: {
  status: 'disputed' | 'conceded';
  reviewer: string;
  about: string;
  given: string;
}): ReviewAbsorption => ({ ...input });

/** the common case: no level forgiven, and the judge allows naught */
const ambient = {
  levelBySlug: new Map([['architect', 1]]),
  overruledLevels: new Set<number>(),
  allowBlockers: 0,
  allowNitpicks: 0,
};

describe('computeUndeclaredConcerns', () => {
  given('[case1] a lane with 3 blockers and no stance declared', () => {
    const givens = [asGiven({ slug: 'architect', blockers: 3, nitpicks: 0 })];

    when('[t0] the undeclared concerns are enumerated', () => {
      then('all THREE are owed, by ordinal, in report order', () => {
        expect(
          computeUndeclaredConcerns({ ...ambient, absorptions: [], givens }),
        ).toEqual([
          {
            slug: 'architect',
            pathGiven: 'g1',
            unreadable: false,
            concerns: ['blocker.1', 'blocker.2', 'blocker.3'],
          },
        ]);
      });
    });
  });

  given('[case2] a lane with 3 blockers, one conceded and one disputed', () => {
    // 🔴 S07 — a lane at 3 owes 3 declarations, and a driver may split them
    const absorptions = [
      asAbsorption({
        status: 'conceded',
        reviewer: 'architect',
        about: 'blocker.1',
        given: 'g1',
      }),
      asAbsorption({
        status: 'disputed',
        reviewer: 'architect',
        about: 'blocker.2',
        given: 'g1',
      }),
    ];
    const givens = [asGiven({ slug: 'architect', blockers: 3, nitpicks: 0 })];

    when('[t0] the undeclared concerns are enumerated', () => {
      then('only the THIRD still stands', () => {
        expect(
          computeUndeclaredConcerns({ ...ambient, absorptions, givens }),
        ).toEqual([
          {
            slug: 'architect',
            pathGiven: 'g1',
            unreadable: false,
            concerns: ['blocker.3'],
          },
        ]);
      });
    });
  });

  given('[case3] every concern on the lane is declared', () => {
    const absorptions = [
      asAbsorption({
        status: 'conceded',
        reviewer: 'architect',
        about: 'blocker.1',
        given: 'g1',
      }),
      asAbsorption({
        status: 'disputed',
        reviewer: 'architect',
        about: 'nitpick.1',
        given: 'g1',
      }),
    ];
    const givens = [asGiven({ slug: 'architect', blockers: 1, nitpicks: 1 })];

    when('[t0] the undeclared concerns are enumerated', () => {
      then('the lane owes naught, so the gate lifts', () => {
        expect(
          computeUndeclaredConcerns({ ...ambient, absorptions, givens }),
        ).toEqual([]);
      });
    });
  });

  given('[case4] a stance declared against a PRIOR given', () => {
    // S03 / S08 — the ordinals index into ONE given; a fresh round renumbers them
    const absorptions = [
      asAbsorption({
        status: 'disputed',
        reviewer: 'architect',
        about: 'blocker.1',
        given: 'g1',
      }),
    ];
    const givens = [
      asGiven({ slug: 'architect', blockers: 1, nitpicks: 0, pathGiven: 'g2' }),
    ];

    when('[t0] the undeclared concerns are enumerated', () => {
      then(
        'the lapsed stance discharges naught — the driver re-declares',
        () => {
          expect(
            computeUndeclaredConcerns({ ...ambient, absorptions, givens }),
          ).toEqual([
            {
              slug: 'architect',
              pathGiven: 'g2',
              unreadable: false,
              concerns: ['blocker.1'],
            },
          ]);
        },
      );
    });
  });

  given('[case5] a NITPICK-ONLY lane that rejects on the threshold', () => {
    // 🔴 F015 / case=10 — the predicate keys on the VERDICT, never on a raw blocker
    //    count. at allowNitpicks 0 a single nitpick holds the road
    const givens = [asGiven({ slug: 'architect', blockers: 0, nitpicks: 2 })];

    when('[t0] the undeclared concerns are enumerated', () => {
      then('both nitpicks owe a stance', () => {
        expect(
          computeUndeclaredConcerns({ ...ambient, absorptions: [], givens }),
        ).toEqual([
          {
            slug: 'architect',
            pathGiven: 'g1',
            unreadable: false,
            concerns: ['nitpick.1', 'nitpick.2'],
          },
        ]);
      });
    });

    when('[t1] the judge allows 7 nitpicks', () => {
      then('the lane is APPROVED, so it owes naught', () => {
        expect(
          computeUndeclaredConcerns({
            ...ambient,
            allowNitpicks: 7,
            absorptions: [],
            givens,
          }),
        ).toEqual([]);
      });
    });
  });

  given('[case6] a lane whose level a human forgave', () => {
    const givens = [asGiven({ slug: 'architect', blockers: 2, nitpicks: 0 })];

    when('[t0] the undeclared concerns are enumerated', () => {
      then('it owes naught — the human already lifted the hold', () => {
        expect(
          computeUndeclaredConcerns({
            ...ambient,
            overruledLevels: new Set([1]),
            absorptions: [],
            givens,
          }),
        ).toEqual([]);
      });
    });
  });

  given('[case7] two lanes, one declared and one not', () => {
    const absorptions = [
      asAbsorption({
        status: 'conceded',
        reviewer: 'architect',
        about: 'blocker.1',
        given: 'g-arch',
      }),
    ];
    const givens = [
      asGiven({
        slug: 'architect',
        blockers: 1,
        nitpicks: 0,
        pathGiven: 'g-arch',
      }),
      asGiven({
        slug: 'mechanic',
        blockers: 1,
        nitpicks: 0,
        pathGiven: 'g-mech',
      }),
    ];

    when('[t0] the undeclared concerns are enumerated', () => {
      then('only the undeclared lane is named', () => {
        expect(
          computeUndeclaredConcerns({
            ...ambient,
            levelBySlug: new Map([
              ['architect', 1],
              ['mechanic', 1],
            ]),
            absorptions,
            givens,
          }),
        ).toEqual([
          {
            slug: 'mechanic',
            pathGiven: 'g-mech',
            unreadable: false,
            concerns: ['blocker.1'],
          },
        ]);
      });
    });
  });

  given('[case8] an UNREADABLE given', () => {
    // its 1-blocker count is FABRICATED — no numeric count was readable, so it carries no
    // verdict, only a malfunction. a stance judges a VERDICT (a dispute says it holds, a
    // concede says it is right), and a malfunction has none to judge. its remedy is a RE-RUN,
    // never a stance (rule.always.diagnose-reviewer-malfunctions; contract.reviewer-output —
    // a malfunction is never a rejection). so it owes naught here; the entrance gate skips it
    // and the reviewer re-runs (F030).
    const givens = [
      asGiven({
        slug: 'architect',
        blockers: 1,
        nitpicks: 0,
        unreadable: true,
      }),
    ];

    when('[t0] the undeclared concerns are enumerated', () => {
      then(
        'it owes NO stance — a malfunction re-runs, it is not disputed or conceded',
        () => {
          expect(
            computeUndeclaredConcerns({ ...ambient, absorptions: [], givens }),
          ).toEqual([]);
        },
      );
    });
  });
});
