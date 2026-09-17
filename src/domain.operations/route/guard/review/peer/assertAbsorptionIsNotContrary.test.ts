import { BadRequestError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { assertAbsorptionIsNotContrary } from './assertAbsorptionIsNotContrary';
import type { ReviewAbsorption } from './getStoneReviewAbsorptions';

/**
 * .what = unit cases for R3 — a CONTRARY second stance on the same concern of the same given
 *         is refused, an identical one is idempotent, and a stance on a different concern or a
 *         different given is admitted
 * .why = a stance is final for its given, keyed on (reviewer, concern, given) never on the
 *        lane (S07). a lane key would refuse the commonest honest act: agree with one point
 *        and argue another. a hash/round key would void a stance the reviewer never re-raised.
 */

const asAbsorption = (input: {
  status: 'disputed' | 'conceded';
  reviewer: string;
  about: string;
  given: string;
  fulcrum?: string;
  severity?: 'better' | 'urgent';
}): ReviewAbsorption => ({ ...input });

describe('assertAbsorptionIsNotContrary', () => {
  given('[case1] no stance stands on this concern', () => {
    when('[t0] a stance is checked', () => {
      then('it passes — the slot is open', () => {
        expect(
          assertAbsorptionIsNotContrary({
            absorptions: [],
            reviewer: 'mech',
            about: 'blocker.1',
            given: 'r3.mech.md',
            intent: 'disputed',
            stone: '5.1',
          }),
        ).toBeUndefined();
      });
    });
  });

  given('[case2] the identical stance already stands', () => {
    const absorptions = [
      asAbsorption({
        status: 'disputed',
        reviewer: 'mech',
        about: 'blocker.1',
        given: 'r3.mech.md',
      }),
    ];

    when('[t0] the same stance is re-declared', () => {
      then('it passes idempotently — no second row, no throw', () => {
        expect(
          assertAbsorptionIsNotContrary({
            absorptions,
            reviewer: 'mech',
            about: 'blocker.1',
            given: 'r3.mech.md',
            intent: 'disputed',
            stone: '5.1',
          }),
        ).toBeUndefined();
      });
    });
  });

  given(
    '[case3] a contrary stance on the same concern of the same given',
    () => {
      const absorptions = [
        asAbsorption({
          status: 'disputed',
          reviewer: 'mech',
          about: 'blocker.1',
          given: 'r3.mech.md',
          fulcrum: '.fulcrums/inventory.of=fulcrums.case=F007-x.md',
        }),
      ];

      when('[t0] the contrary stance is declared', () => {
        const error = getError(() =>
          assertAbsorptionIsNotContrary({
            absorptions,
            reviewer: 'mech',
            about: 'blocker.1',
            given: 'r3.mech.md',
            intent: 'conceded',
            stone: '5.1',
          }),
        );

        then('it throws', () => {
          expect(error).toBeInstanceOf(BadRequestError);
        });

        then(
          'it names the extant status and the given it stands against',
          () => {
            expect(error.message).toContain('already disputed');
            expect(error.message).toContain('r3.mech.md');
          },
        );

        then('it names the fulcrum of the extant stance, when present', () => {
          expect(error.message).toContain(
            '.fulcrums/inventory.of=fulcrums.case=F007-x.md',
          );
        });

        then('it names the rewind as the void-now exit', () => {
          expect(error.message).toContain('--as rewound');
        });
      });
    },
  );

  given(
    '[case4] a contrary stance on a DIFFERENT concern of the same lane',
    () => {
      // the commonest honest act: agree with one point, argue another (S07)
      const absorptions = [
        asAbsorption({
          status: 'conceded',
          reviewer: 'mech',
          about: 'blocker.1',
          given: 'r3.mech.md',
        }),
      ];

      when('[t0] a dispute on blocker.2 of the same given is declared', () => {
        then('it passes — R3 keys on the concern, never the lane', () => {
          expect(
            assertAbsorptionIsNotContrary({
              absorptions,
              reviewer: 'mech',
              about: 'blocker.2',
              given: 'r3.mech.md',
              intent: 'disputed',
              stone: '5.1',
            }),
          ).toBeUndefined();
        });
      });
    },
  );

  given('[case5] a contrary stance on the same concern of a NEW given', () => {
    // the lane spoke again — the artifact moved, so the stance slot re-opens (S03)
    const absorptions = [
      asAbsorption({
        status: 'disputed',
        reviewer: 'mech',
        about: 'blocker.1',
        given: 'r3.mech.md',
      }),
    ];

    when('[t0] a concede on blocker.1 of the r4 given is declared', () => {
      then('it passes — a stance is final only for ITS given', () => {
        expect(
          assertAbsorptionIsNotContrary({
            absorptions,
            reviewer: 'mech',
            about: 'blocker.1',
            given: 'r4.mech.md',
            intent: 'conceded',
            stone: '5.1',
          }),
        ).toBeUndefined();
      });
    });
  });

  // 🔴 r7 b1 — the key was (status, reviewer, about, given), so a `better` → `urgent`
  //    upgrade read as idempotent: R3 admitted it, the write was skipped, and the ack
  //    rendered the NEW grade while the ledger kept the old. the judge then shed the row
  //    as `better` and the stone passed with no human warned
  given('[case6] the same concede, RE-GRADED on an unchanged given', () => {
    const absorptions = [
      asAbsorption({
        status: 'conceded',
        reviewer: 'mech',
        about: 'blocker.1',
        given: 'r3.mech.md',
        severity: 'better',
      }),
    ];

    when('[t0] the driver re-declares it as urgent', () => {
      const error = getError(() =>
        assertAbsorptionIsNotContrary({
          absorptions,
          reviewer: 'mech',
          about: 'blocker.1',
          given: 'r3.mech.md',
          intent: 'conceded',
          stone: '5.1',
          severity: 'urgent',
        }),
      );

      then('it is REFUSED — a re-grade is a change, never a repeat', () => {
        expect(error).toBeInstanceOf(BadRequestError);
      });

      then(
        'the refusal names both grades, so the driver sees the divergence',
        () => {
          expect(error.message).toContain('already conceded as better');
          expect(error.message).toContain('on record  = --severity better');
          expect(error.message).toContain('you passed = --severity urgent');
        },
      );

      then('and it names the two ways out', () => {
        expect(error.message).toContain('change the artifact and re-arrive');
        expect(error.message).toContain('--as rewound');
      });

      // 🔴 r009 i011 nitpick.1 — a fragment pin leaves the surrounding body free to
      //    regress. pinned whole, as the on-record/you-passed divergence and the two
      //    exits are exactly what a driver reads to decide the refusal
      then('the refusal is pinned whole', () => {
        expect(error.message).toMatchSnapshot();
      });
    });

    when('[t1] the driver re-declares it at the SAME grade', () => {
      then('it passes — that is a true repeat', () => {
        expect(
          assertAbsorptionIsNotContrary({
            absorptions,
            reviewer: 'mech',
            about: 'blocker.1',
            given: 'r3.mech.md',
            intent: 'conceded',
            stone: '5.1',
            severity: 'better',
          }),
        ).toBeUndefined();
      });
    });

    when('[t2] a LEGACY ungraded row is re-declared as better', () => {
      then('it passes — an absent grade reads as `better`, the floor', () => {
        expect(
          assertAbsorptionIsNotContrary({
            absorptions: [
              asAbsorption({
                status: 'conceded',
                reviewer: 'mech',
                about: 'blocker.1',
                given: 'r3.mech.md',
              }),
            ],
            reviewer: 'mech',
            about: 'blocker.1',
            given: 'r3.mech.md',
            intent: 'conceded',
            stone: '5.1',
            severity: 'better',
          }),
        ).toBeUndefined();
      });
    });
  });

  given('[case7] the same dispute, RE-CITED on a different fulcrum', () => {
    const absorptions = [
      asAbsorption({
        status: 'disputed',
        reviewer: 'mech',
        about: 'blocker.1',
        given: 'r3.mech.md',
        fulcrum: '.fulcrums/inventory.of=fulcrums.case=F001-first.md',
      }),
    ];

    when('[t0] the driver re-declares it with a new fulcrum', () => {
      const error = getError(() =>
        assertAbsorptionIsNotContrary({
          absorptions,
          reviewer: 'mech',
          about: 'blocker.1',
          given: 'r3.mech.md',
          intent: 'disputed',
          stone: '5.1',
          why: '.fulcrums/inventory.of=fulcrums.case=F002-second.md',
        }),
      );

      then(
        'it is REFUSED — the argument is part of what the stance says',
        () => {
          expect(error).toBeInstanceOf(BadRequestError);
          expect(error.message).toContain('with a different --why');
        },
      );

      then('the refusal names both fulcrums', () => {
        expect(error.message).toContain('F001-first.md');
        expect(error.message).toContain('F002-second.md');
      });

      // 🔴 r009 i011 nitpick.1 — pinned whole, the same clamp case6 owes
      then('the refusal is pinned whole', () => {
        expect(error.message).toMatchSnapshot();
      });
    });

    when('[t1] the driver re-declares it on the SAME fulcrum', () => {
      then('it passes — a true repeat', () => {
        expect(
          assertAbsorptionIsNotContrary({
            absorptions,
            reviewer: 'mech',
            about: 'blocker.1',
            given: 'r3.mech.md',
            intent: 'disputed',
            stone: '5.1',
            why: '.fulcrums/inventory.of=fulcrums.case=F001-first.md',
          }),
        ).toBeUndefined();
      });
    });
  });

  // 🔴 r010 i008 blocker.2 — isRecite was gated to `intent === 'disputed'` alone, so a
  //    re-concede with a REVISED --why fell through as "the same stance again": the
  //    caller's alreadyOnRecord short-circuit then skipped the write, and the driver's
  //    new justification text was silently dropped — believed recorded, and never was
  given('[case8] the same concede, RE-CITED with a changed --why', () => {
    const absorptions = [
      asAbsorption({
        status: 'conceded',
        reviewer: 'mech',
        about: 'blocker.1',
        given: 'r3.mech.md',
        severity: 'better',
        fulcrum: 'first justification',
      }),
    ];

    when('[t0] the driver re-declares it with revised --why text', () => {
      const error = getError(() =>
        assertAbsorptionIsNotContrary({
          absorptions,
          reviewer: 'mech',
          about: 'blocker.1',
          given: 'r3.mech.md',
          intent: 'conceded',
          stone: '5.1',
          severity: 'better',
          why: 'revised justification',
        }),
      );

      then('it is REFUSED, never silently dropped', () => {
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain('with a different --why');
      });

      then('the refusal names both texts', () => {
        expect(error.message).toContain('first justification');
        expect(error.message).toContain('revised justification');
      });

      // 🔴 r009 i011 nitpick.1 — pinned whole, the same clamp case6/case7 owe
      then('the refusal is pinned whole', () => {
        expect(error.message).toMatchSnapshot();
      });
    });

    when('[t1] the driver re-declares it with the SAME --why text', () => {
      then('it passes — a true repeat', () => {
        expect(
          assertAbsorptionIsNotContrary({
            absorptions,
            reviewer: 'mech',
            about: 'blocker.1',
            given: 'r3.mech.md',
            intent: 'conceded',
            stone: '5.1',
            severity: 'better',
            why: 'first justification',
          }),
        ).toBeUndefined();
      });
    });

    // 🔴 the fix above's own edge — an OMITTED --why is not a re-cite. red under a naive
    //    `(extant.fulcrum ?? null) !== (input.why ?? null)` comparison, which reads a
    //    dropped flag the same as a cleared one and refuses a driver's identical repeat
    when('[t2] the driver re-declares it with NO --why passed at all', () => {
      then('it passes — an absent --why is not a re-cite', () => {
        expect(
          assertAbsorptionIsNotContrary({
            absorptions,
            reviewer: 'mech',
            about: 'blocker.1',
            given: 'r3.mech.md',
            intent: 'conceded',
            stone: '5.1',
            severity: 'better',
          }),
        ).toBeUndefined();
      });
    });
  });
});
