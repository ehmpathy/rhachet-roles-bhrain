import { given, then, when } from 'test-fns';

import { getOneWarmersSeen } from './getOneWarmersSeen';

/**
 * .what = clamps the COUNT half of the warmer caveat, and clamps that BOTH folds read it
 * .why = the operation was extracted to stop `tree` and `grove` from two copies of one
 *        decision. an extraction alone does not buy that: this branch's own yield records
 *        the shape — *"`isTargetDiffSent` bound two of three call sites. `review.corpus`
 *        re-derived the same decision and drifted — the exact defect the extraction was
 *        meant to make impossible."*
 *
 *        ⇒ so `[case4]` is the load-bearing case here, and it is not about arithmetic at
 *        all: it reads the two production folds and asserts each DELEGATES. a future edit
 *        that re-inlines `runs.filter(...).length` at either breadth goes red.
 */
describe('getOneWarmersSeen', () => {
  given('[case1] no run carried a warmer', () => {
    when('[t0] the count is read', () => {
      then('it answers 0, so the caveat stays silent', () => {
        expect(
          getOneWarmersSeen({ runs: [{ warmer: null }, { warmer: null }] }),
        ).toEqual(0);
      });
    });
  });

  given('[case2] some runs carried a warmer', () => {
    when('[t0] the count is read', () => {
      then('it counts exactly the non-null ones', () => {
        expect(
          getOneWarmersSeen({
            runs: [
              { warmer: null },
              { warmer: { cost: 'USD 0.004' } },
              { warmer: null },
              { warmer: { cost: 'USD 0.002' } },
            ],
          }),
        ).toEqual(2);
      });
    });
  });

  given('[case3] a warmer ran and DEFERRED every round, so it spent $0', () => {
    // 🔴 the docblock's second `.note` made this a declared law rather than an
    //    accident of the predicate, and a law with no clamp is a comment. a `$0`
    //    warmer is a figure ABSENT from the total, so the caveat's claim —
    //    *"this total excludes a spender that was present"* — is true of it.
    when('[t0] the count is read', () => {
      then(
        '🔴 it still counts, because presence is the claim, never spend',
        () => {
          expect(
            getOneWarmersSeen({
              runs: [{ warmer: { cost: 'USD 0', pokes: 0 } }, { warmer: null }],
            }),
          ).toEqual(1);
        },
      );
    });
  });

  given('[case5] a run whose warmer field is absent', () => {
    // 🔴 the type clamp: `undefined` passes `!== null`, so an `unknown` field would
    //    count an absent warmer as seen. the `@ts-expect-error` goes red at the type
    //    check the day the input type widens back to admit it.
    when('[t0] the count is read', () => {
      then(
        'the compiler refuses the field, since at runtime it would count',
        () => {
          expect(
            // @ts-expect-error — an absent warmer field is no warmer, and no null either
            getOneWarmersSeen({ runs: [{ warmer: undefined }] }),
          ).toEqual(1);
        },
      );
    });
  });

  given('[case4] the two production folds that must not disagree', () => {
    // 🔴 the point of the whole operation. an extracted decision binds only the
    //    call sites someone remembered to wire, so what is asserted here is the
    //    DELEGATION — never the arithmetic, which `[case1]`–`[case3]` already hold.
    when('[t0] each fold module is read as source', () => {
      const readOne = (path: string): string =>
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('fs').readFileSync(
          require('path').join(__dirname, path),
          'utf8',
        ) as string;

      const atTree = readOne('./meter/genReviewMeterReport.ts');
      const atGrove = readOne('./grove/genReviewGroveReport.ts');

      then('the `tree` fold delegates to this operation', () => {
        expect(atTree).toContain('getOneWarmersSeen(');
      });

      then('the `grove` fold delegates to this operation', () => {
        expect(atGrove).toContain('getOneWarmersSeen(');
      });

      then('🔴 neither re-derives the predicate inline', () => {
        // the exact shape the peer raised at i010 r003 nitpick.1, at both sites:
        //   warmersSeen: runs.filter((one) => one.warmer !== null).length
        for (const source of [atTree, atGrove])
          expect(source).not.toMatch(/warmer !== null\)\.length/);
      });
    });
  });
});
