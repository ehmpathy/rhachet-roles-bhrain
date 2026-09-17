import { given, then, when } from 'test-fns';

import { getOneReviewLevelPourBound } from './getOneReviewLevelPourBound';

/**
 * .what = clamps the bound the pour announce states
 *
 * 🔴 .why = the announce once rendered the level-wide default verbatim, so
 *         `[case2]` — the shape this repo's own `route-peer-concurrency`
 *         fixture declares — printed `≤10 at a time` while exactly one lane
 *         ran. the extant acceptance clamp asserted only `pours 4 lanes` and
 *         never the `≤N` clause, so the misreport was uncovered (i011/r9)
 */
describe('getOneReviewLevelPourBound', () => {
  given('[case1] a level of four ungrouped lanes, level bound of ten', () => {
    when('[t0] the bound is computed', () => {
      then(
        'null — a bound of ten admits all four, so it holds naught back',
        () => {
          // .why = a `≤4` clause here would describe the ROSTER, and invite a
          //        reader to hunt for a valve that is not there
          expect(
            getOneReviewLevelPourBound({
              members: [
                { group: null },
                { group: null },
                { group: null },
                { group: null },
              ],
              levelConcurrency: 10,
              groups: {},
            }),
          ).toEqual(null);
        },
      );
    });
  });

  given('[case2] 🔴 three lanes, all in one group bound at one', () => {
    // the `route-peer-concurrency` fixture's l3, verbatim — the shape that
    // announced the wrong cap
    const members = [
      { group: 'serial' },
      { group: 'serial' },
      { group: 'serial' },
    ];

    when('[t0] the bound is computed', () => {
      then('1 — the group binds, never the level default', () => {
        expect(
          getOneReviewLevelPourBound({
            members,
            levelConcurrency: 10,
            groups: { serial: { concurrency: 1 } },
          }),
        ).toEqual(1);
      });

      then('it is NOT the level-wide default', () => {
        // 🔴 the regression this leaf exists to hold. `10` is what the announce
        //    printed before the bound was computed at all
        expect(
          getOneReviewLevelPourBound({
            members,
            levelConcurrency: 10,
            groups: { serial: { concurrency: 1 } },
          }),
        ).not.toEqual(10);
      });
    });
  });

  given('[case3] a group whose bound is WIDER than its own membership', () => {
    when('[t0] two members sit behind a bound of five', () => {
      then('the membership caps the contribution, never the bound', () => {
        // .why = a group bound is a cap on the group. two lanes cannot put five
        //        aloft, so `min(5, 2) = 2` — and 2 admits the roster
        expect(
          getOneReviewLevelPourBound({
            members: [{ group: 'wide' }, { group: 'wide' }],
            levelConcurrency: 10,
            groups: { wide: { concurrency: 5 } },
          }),
        ).toEqual(null);
      });
    });
  });

  given(
    '[case4] a bounded group BESIDE an ungrouped lane — the F13 mix',
    () => {
      when('[t0] two group members and one ungrouped lane', () => {
        then('2 — the group contributes one, the ungrouped lane one', () => {
          // .why = the ungrouped lane contends for a level slot only, so it pours
          //        beside the group rather than inside it. the honest cap is 2,
          //        which is exactly the leak `asConcurrencyGroupLeakAdvisory`
          //        advises the author about
          expect(
            getOneReviewLevelPourBound({
              members: [
                { group: 'serial' },
                { group: 'serial' },
                { group: null },
              ],
              levelConcurrency: 10,
              groups: { serial: { concurrency: 1 } },
            }),
          ).toEqual(2);
        });
      });
    },
  );

  given('[case5] two groups at one level, each with its own bound', () => {
    when('[t0] the bounds are summed', () => {
      then('each group contributes min(bound, membership)', () => {
        // anthropic: min(1, 2) = 1 · fireworks: min(2, 3) = 2 ⇒ 3 of 5
        expect(
          getOneReviewLevelPourBound({
            members: [
              { group: 'anthropic' },
              { group: 'anthropic' },
              { group: 'fireworks' },
              { group: 'fireworks' },
              { group: 'fireworks' },
            ],
            levelConcurrency: 10,
            groups: {
              anthropic: { concurrency: 1 },
              fireworks: { concurrency: 2 },
            },
          }),
        ).toEqual(3);
      });
    });
  });

  given('[case6] a roster WIDER than the level default', () => {
    when('[t0] twelve ungrouped lanes under a bound of ten', () => {
      then('10 — the level default binds, and the clause is owed', () => {
        expect(
          getOneReviewLevelPourBound({
            members: Array.from({ length: 12 }, () => ({ group: null })),
            levelConcurrency: 10,
            groups: {},
          }),
        ).toEqual(10);
      });
    });

    when('[t1] the level default is narrower than a group sum', () => {
      then('the level caps it — a group declared wider cannot widen it', () => {
        // .why = `runWithinConcurrencyBounds` nests group OUTSIDE level, so the
        //        pour yields min(group, level) either way. the display must
        //        agree with the enforcement
        expect(
          getOneReviewLevelPourBound({
            members: Array.from({ length: 6 }, () => ({ group: 'wide' })),
            levelConcurrency: 2,
            groups: { wide: { concurrency: 5 } },
          }),
        ).toEqual(2);
      });
    });
  });

  given('[case7] an empty roster', () => {
    when('[t0] the bound is computed', () => {
      then('null — a level that pours naught has no bound to state', () => {
        expect(
          getOneReviewLevelPourBound({
            members: [],
            levelConcurrency: 10,
            groups: {},
          }),
        ).toEqual(null);
      });
    });
  });

  given('[case8] a member that names a group with no declared bound', () => {
    // 🟡 `assertConcurrencyGroupsResolve` refuses this at parse and
    //    `runWithinConcurrencyBounds` throws on it at the pour, so this reach
    //    is for a guard built by hand around the parser
    when('[t0] the bound is computed anyway', () => {
      then('it errs toward the roster rather than invents a bound', () => {
        expect(
          getOneReviewLevelPourBound({
            members: [{ group: 'ghost' }, { group: 'ghost' }, { group: null }],
            levelConcurrency: 10,
            groups: {},
          }),
        ).toEqual(null);
      });
    });
  });

  given('[case9] the computation is a pure value', () => {
    when('[t0] it runs twice on one input', () => {
      then('both agree — no clock, no counter, no i/o', () => {
        const input = {
          members: [{ group: 'serial' }, { group: 'serial' }],
          levelConcurrency: 10,
          groups: { serial: { concurrency: 1 } },
        };
        expect(getOneReviewLevelPourBound(input)).toEqual(
          getOneReviewLevelPourBound(input),
        );
      });
    });
  });
});
