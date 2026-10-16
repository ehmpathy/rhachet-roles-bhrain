import { asIsoPrice } from 'iso-price';
import { given, then, when } from 'test-fns';

import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import { getOneAccountedCost } from '@src/domain.operations/review/meter/getOneAccountedCost';

/**
 * .what = one run at a chosen grade, with a chosen spend
 * .why = the law turns entirely on grade and on whether a cost was recorded, so a
 *        case must set both explicitly
 *
 * .note = returns the `Pick`ed shape the law accepts, never a whole
 *         `ReviewRunMeter` — so the fixture needs no cast. it once built two
 *         fields and wrote `as ReviewRunMeter` over the gap, which told the
 *         compiler a falsehood to satisfy a contract wider than the law reads
 *         (rule.forbid.as-cast, rule.require.shapefit)
 */
const asRun = (input: {
  grade: ReviewRunMeter['grade'];
  cost: string | null;
}): Pick<ReviewRunMeter, 'grade' | 'cost'> => ({
  grade: input.grade,
  cost:
    input.cost === null
      ? null
      : { total: asIsoPrice(input.cost), cacheSaved: null },
});

/**
 * .what = unit tests for the absent/zero law that rules every spend figure
 * .why = this transformer is the one place the meter decides whether a spend
 *        is known. it is pure, so it is unit-tested
 *        (rule.forbid.unit.remote-boundaries), and it is declared once
 *        because a second expression of it had already drifted — the grove
 *        rollup rendered an all-unknown lane as `$0.00`.
 */
describe('getOneAccountedCost', () => {
  given('[case1] runs whose spend was measured', () => {
    when('[t0] the cost is taken', () => {
      then('it sums every measured run', () => {
        expect(
          getOneAccountedCost({
            runs: [
              asRun({ grade: 'metered', cost: '$0.25' }),
              asRun({ grade: 'metered', cost: '$0.75' }),
            ],
          }),
        ).toEqual(asIsoPrice('$1.00'));
      });
    });
  });

  given('[case2] runs that were all REFUSED at validation', () => {
    // a refusal never reached the brain, so nil cost is a FACT — and an absent
    // mark here would discard the very distinction the grade exists to carry
    when('[t0] the cost is taken', () => {
      then('it answers a KNOWN nil, never absent', () => {
        expect(
          getOneAccountedCost({
            runs: [
              asRun({ grade: 'refused', cost: null }),
              asRun({ grade: 'refused', cost: null }),
            ],
          }),
        ).toEqual(asIsoPrice('$0'));
      });
    });
  });

  given('[case3] runs whose spend was never RECORDED', () => {
    // the failhide this forbids: each run compiled a prompt then died before
    // it wrote metrics, so the brain may genuinely have been billed. a
    // `$0.00` here states a measurement nobody made as a fact, and drags
    // down every average it enters
    when('[t0] the cost is taken', () => {
      then('it answers ABSENT, never a zero', () => {
        expect(
          getOneAccountedCost({
            runs: [
              asRun({ grade: 'unknown', cost: null }),
              asRun({ grade: 'unknown', cost: null }),
            ],
          }),
        ).toEqual(null);
      });
    });
  });

  given('[case4] a mixed set — one measured, one unrecorded', () => {
    when('[t0] the cost is taken', () => {
      then('it reports what IS known, rather than absent', () => {
        // at least one run accounted for itself, so a figure exists. the census
        // rides beside it, so a reader weighs it against its coverage
        expect(
          getOneAccountedCost({
            runs: [
              asRun({ grade: 'metered', cost: '$0.25' }),
              asRun({ grade: 'unknown', cost: null }),
            ],
          }),
        ).toEqual(asIsoPrice('$0.25'));
      });
    });
  });

  given('[case5] a set that holds no run at all', () => {
    when('[t0] the cost is taken', () => {
      then('it answers ABSENT — there is nobody to have spent', () => {
        expect(getOneAccountedCost({ runs: [] })).toEqual(null);
      });
    });
  });
});
