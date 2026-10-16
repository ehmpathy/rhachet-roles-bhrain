import { given, then, when } from 'test-fns';

import { getOneReviewWarmerPlanOrRefusal } from './getOneReviewWarmerPlanOrRefusal';

describe('getOneReviewWarmerPlanOrRefusal', () => {
  given('[case1] a well-formed --warmer', () => {
    when('[t0] `off` is asked for', () => {
      then('it answers no plan and no refusal', () => {
        expect(getOneReviewWarmerPlanOrRefusal({ flag: 'off' })).toEqual({
          plan: null,
          refusal: null,
        });
      });
    });

    when('[t1] a cadence is asked for', () => {
      then('it answers the plan and no refusal', () => {
        const choice = getOneReviewWarmerPlanOrRefusal({ flag: '2x,4m' });
        expect(choice.refusal).toEqual(null);
        expect(choice.plan).not.toEqual(null);
      });
    });
  });

  given('[case2] a malformed --warmer', () => {
    when('[t0] the cadence is garbled', () => {
      then('it answers a refusal body that echoes the value', () => {
        const choice = getOneReviewWarmerPlanOrRefusal({ flag: 'lots' });
        expect(choice.plan).toEqual(null);
        expect(choice.refusal).toContain('lots');
      });
    });
  });
});
