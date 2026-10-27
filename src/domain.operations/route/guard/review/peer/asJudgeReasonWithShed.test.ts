import { given, then, when } from 'test-fns';

import { asJudgeReasonWithShed } from './asJudgeReasonWithShed';

/**
 * .what = unit cases for the shed fold on a verdict's reason
 * .why = the reason is the one judge line a driver meets, so its bytes are pinned per axis
 */
describe('asJudgeReasonWithShed', () => {
  given('[case1] no stance moved the sum', () => {
    when('[t0] rendered', () => {
      then('the reason stands byte for byte', () => {
        expect(
          asJudgeReasonWithShed({
            reason: 'blockers exceed threshold (3 > 0)',
            disputed: { blockers: 0, nitpicks: 0 },
            concededBetter: { blockers: 0, nitpicks: 0 },
          }),
        ).toEqual('blockers exceed threshold (3 > 0)');
      });
    });
  });

  given('[case2] a pass over shed blockers', () => {
    when('[t0] rendered', () => {
      then('the pass names the blocker shed', () => {
        expect(
          asJudgeReasonWithShed({
            reason: 'reviews pass (blockers: 0/0, nitpicks: 1/7)',
            disputed: { blockers: 0, nitpicks: 0 },
            concededBetter: { blockers: 3, nitpicks: 0 },
          }),
        ).toEqual(
          'reviews pass (blockers: 0/0, nitpicks: 1/7), after 3 blockers shed (0 disputed + 3 conceded better)',
        );
      });
    });
  });

  given('[case3] a hold after a shed on both axes', () => {
    when('[t0] rendered', () => {
      then('each axis renders its own segment, blockers first', () => {
        expect(
          asJudgeReasonWithShed({
            reason: 'blockers exceed threshold (1 > 0)',
            disputed: { blockers: 1, nitpicks: 4 },
            concededBetter: { blockers: 2, nitpicks: 0 },
          }),
        ).toEqual(
          'blockers exceed threshold (1 > 0), after 3 blockers shed (1 disputed + 2 conceded better), 4 nitpicks shed (4 disputed + 0 conceded better)',
        );
      });
    });
  });

  given('[case4] only nitpicks shed', () => {
    when('[t0] rendered', () => {
      then('only the nitpick segment renders', () => {
        expect(
          asJudgeReasonWithShed({
            reason: 'nitpicks exceed threshold (9 > 7)',
            disputed: { blockers: 0, nitpicks: 5 },
            concededBetter: { blockers: 0, nitpicks: 0 },
          }),
        ).toEqual(
          'nitpicks exceed threshold (9 > 7), after 5 nitpicks shed (5 disputed + 0 conceded better)',
        );
      });
    });
  });
});
