import { given, then, when } from 'test-fns';

import { getReviewedJudgeThresholds } from './getReviewedJudgeThresholds';

describe('getReviewedJudgeThresholds', () => {
  given('[case1] guard has reviewed? judge with thresholds', () => {
    when('[t0] both thresholds present', () => {
      then('extracts both values', () => {
        const result = getReviewedJudgeThresholds({
          judges: [
            '$rhx route.stone.judge --mechanism reviewed? --stone $stone --route $route --allow-blockers 3 --allow-nitpicks 10',
            '$rhx route.stone.judge --mechanism approved? --stone $stone --route $route',
          ],
        });
        expect(result).toEqual({ allowBlockers: 3, allowNitpicks: 10 });
      });
    });

    when('[t1] only blockers threshold', () => {
      then('defaults nitpicks to 0', () => {
        const result = getReviewedJudgeThresholds({
          judges: [
            '$rhx route.stone.judge --mechanism reviewed? --allow-blockers 5',
          ],
        });
        expect(result).toEqual({ allowBlockers: 5, allowNitpicks: 0 });
      });
    });

    when('[t2] only nitpicks threshold', () => {
      then('defaults blockers to 0', () => {
        const result = getReviewedJudgeThresholds({
          judges: [
            '$rhx route.stone.judge --mechanism reviewed? --allow-nitpicks 15',
          ],
        });
        expect(result).toEqual({ allowBlockers: 0, allowNitpicks: 15 });
      });
    });

    when('[t3] no thresholds in command', () => {
      then('defaults both to 0', () => {
        const result = getReviewedJudgeThresholds({
          judges: ['$rhx route.stone.judge --mechanism reviewed?'],
        });
        expect(result).toEqual({ allowBlockers: 0, allowNitpicks: 0 });
      });
    });
  });

  given('[case2] guard has no reviewed? judge', () => {
    when('[t0] only approved? judge', () => {
      then('returns null', () => {
        const result = getReviewedJudgeThresholds({
          judges: ['$rhx route.stone.judge --mechanism approved?'],
        });
        expect(result).toEqual(null);
      });
    });

    when('[t1] empty judges array', () => {
      then('returns null', () => {
        const result = getReviewedJudgeThresholds({
          judges: [],
        });
        expect(result).toEqual(null);
      });
    });
  });

  given('[case3] uses --type instead of --mechanism', () => {
    when('[t0] --type reviewed?', () => {
      then('extracts thresholds', () => {
        const result = getReviewedJudgeThresholds({
          judges: [
            '$rhx route.stone.judge --type reviewed? --allow-blockers 2 --allow-nitpicks 5',
          ],
        });
        expect(result).toEqual({ allowBlockers: 2, allowNitpicks: 5 });
      });
    });
  });
});
