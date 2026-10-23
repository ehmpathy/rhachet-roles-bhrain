import { given, then, when } from 'test-fns';

import { getOneReviewRunGrade } from '@src/domain.operations/review/meter/getOneReviewRunGrade';

/**
 * .what = the grade an unmetered run earns, over the whole 2×2×2 of its three witnesses
 * .why = the operation has exactly three inputs and each is a boolean, so the input
 *        space is eight cells and every one is walked below. a sampled set would
 *        leave the cell that carries a defect untested — and such cells were graded
 *        wrong before their witness joined the inputs.
 */
const WITNESSES = [
  'promptPresent',
  'compiledPresent',
  'answerPresent',
] as const;
type Witnesses = Record<(typeof WITNESSES)[number], boolean>;

// the eight cells, listed whole: only the cell with no witness at all is refused
const TEST_CASES: { given: Witnesses; expect: 'refused' | 'unknown' }[] = [
  {
    given: { promptPresent: true, compiledPresent: true, answerPresent: true },
    expect: 'unknown',
  },
  {
    given: { promptPresent: true, compiledPresent: true, answerPresent: false },
    expect: 'unknown',
  },
  {
    given: { promptPresent: true, compiledPresent: false, answerPresent: true },
    expect: 'unknown',
  },
  {
    given: {
      promptPresent: true,
      compiledPresent: false,
      answerPresent: false,
    },
    expect: 'unknown',
  },
  {
    given: { promptPresent: false, compiledPresent: true, answerPresent: true },
    expect: 'unknown',
  },
  {
    given: {
      promptPresent: false,
      compiledPresent: true,
      answerPresent: false,
    },
    expect: 'unknown',
  },
  {
    given: {
      promptPresent: false,
      compiledPresent: false,
      answerPresent: true,
    },
    expect: 'unknown',
  },
  {
    given: {
      promptPresent: false,
      compiledPresent: false,
      answerPresent: false,
    },
    expect: 'refused',
  },
];

// a cell's label names the witnesses it holds, so a red cell names itself
const asCellLabel = (input: { cell: Witnesses }): string => {
  const held = WITNESSES.filter((name) => input.cell[name]);
  return held.length === 0 ? 'no witness at all' : held.join(' + ');
};

describe('getOneReviewRunGrade', () => {
  given('[case1] every cell of the three witnesses', () => {
    when('[t0] each is graded', () => {
      TEST_CASES.map((thisCase) =>
        then(
          `${asCellLabel({ cell: thisCase.given })} → ${thisCase.expect}`,
          () => {
            expect(getOneReviewRunGrade(thisCase.given)).toEqual(
              thisCase.expect,
            );
          },
        ),
      );
    });
  });

  /**
   * the cell the compiled witness was added for. a review prompt runs to megabytes,
   * so a driver reclaims disk by a prune of the prompt files. `metrics.compiled.json`
   * is written in the same call as the prompt and outlives the prune.
   */
  given('[case2] 🔴 prompt pruned, compiled kept', () => {
    when('[t0] the run is graded', () => {
      then(
        'it is UNKNOWN, never refused — the compiled file outlives the prune',
        () => {
          expect(
            getOneReviewRunGrade({
              promptPresent: false,
              compiledPresent: true,
              answerPresent: false,
            }),
          ).toEqual('unknown');
        },
      );
    });
  });

  /**
   * the cell the answer witness was added for: a run from before the compiled file
   * existed, its prompt pruned — yet its `output.response.json` survives. the brain's
   * own answer is the strongest proof a run was billed, so a `$0 refused` here would
   * understate a grove's spend in silence (rule.forbid.failhide).
   */
  given('[case3] 🔴 prompt pruned, no compiled, answer kept', () => {
    when('[t0] the run is graded', () => {
      then('it is UNKNOWN, never refused — the answer proves a bill', () => {
        expect(
          getOneReviewRunGrade({
            promptPresent: false,
            compiledPresent: false,
            answerPresent: true,
          }),
        ).toEqual('unknown');
      });
    });

    when('[t1] the same dir is read with the answer withheld', () => {
      then('it reads refused — so the witness is what moves the grade', () => {
        expect(
          getOneReviewRunGrade({
            promptPresent: false,
            compiledPresent: false,
            answerPresent: false,
          }),
        ).toEqual('refused');
      });
    });
  });
});
