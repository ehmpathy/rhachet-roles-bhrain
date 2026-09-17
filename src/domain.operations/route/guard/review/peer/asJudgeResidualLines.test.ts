import { given, then, when } from 'test-fns';

import { asJudgeResidualLines } from './asJudgeResidualLines';

/**
 * .what = unit cases for the judge's dispute arithmetic render
 * .why = this is the ONE line that answers *"did my dispute move the stone?"*, and it lived
 *        inline in the cli with no test at any grain (r10 b1). a per-CONCERN command with a
 *        STONE-WIDE effect is unreadable without it, so its bytes are pinned here.
 */
describe('asJudgeResidualLines', () => {
  given('[case1] no concern was disputed', () => {
    when('[t0] rendered', () => {
      then('it renders naught — the driver never asked the question', () => {
        expect(
          asJudgeResidualLines({
            disputed: { blockers: 0, nitpicks: 0 },
            residual: { blockers: 3, nitpicks: 5 },
            allowBlockers: 0,
            allowNitpicks: 7,
          }),
        ).toEqual([]);
      });
    });
  });

  given('[case2] a dispute shed a blocker, and the stone now clears', () => {
    const lines = asJudgeResidualLines({
      disputed: { blockers: 1, nitpicks: 0 },
      residual: { blockers: 0, nitpicks: 5 },
      allowBlockers: 0,
      allowNitpicks: 7,
    });

    when('[t0] rendered', () => {
      then('it names what left the tally', () => {
        expect(lines[0]).toEqual(
          'disputed: 1 blockers, 0 nitpicks excluded from the tally',
        );
      });

      then('it names the residual AGAINST its allowance, never bare', () => {
        expect(lines[1]).toEqual('residual: 0/0 blockers, 5/7 nitpicks');
      });
    });
  });

  given(
    '[case3] a dispute shed a nitpick and the stone is STILL held — the case the line exists for',
    () => {
      // the per-concern command worked; the stone-wide sum is still over. with no
      // residual line a driver reads the hold as "my dispute failed" and re-disputes
      const lines = asJudgeResidualLines({
        disputed: { blockers: 0, nitpicks: 1 },
        residual: { blockers: 0, nitpicks: 9 },
        allowBlockers: 0,
        allowNitpicks: 7,
      });

      when('[t0] rendered', () => {
        then('the dispute IS reported as effective', () => {
          expect(lines[0]).toContain('1 nitpicks excluded from the tally');
        });

        then('and the residual shows WHY the stone is still held', () => {
          expect(lines[1]).toEqual('residual: 0/0 blockers, 9/7 nitpicks');
        });
      });
    },
  );

  given('[case4] a dispute on BOTH axes', () => {
    when('[t0] rendered', () => {
      then('the bytes a driver reads are pinned', () => {
        expect(
          asJudgeResidualLines({
            disputed: { blockers: 2, nitpicks: 3 },
            residual: { blockers: 1, nitpicks: 4 },
            allowBlockers: 0,
            allowNitpicks: 7,
          }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case5] an unbounded allowance', () => {
    when('[t0] rendered', () => {
      then('the allowance renders as given — no Infinity arithmetic', () => {
        const lines = asJudgeResidualLines({
          disputed: { blockers: 1, nitpicks: 0 },
          residual: { blockers: 0, nitpicks: 0 },
          allowBlockers: Infinity,
          allowNitpicks: Infinity,
        });
        expect(lines[1]).toEqual(
          'residual: 0/Infinity blockers, 0/Infinity nitpicks',
        );
      });
    });
  });
});
