import { given, then, when } from 'test-fns';

import { isRunCostBreakdownReconciled } from './isRunCostBreakdownReconciled';

describe('isRunCostBreakdownReconciled', () => {
  given('[case1] a breakdown that IS the bill', () => {
    when('[t0] the parts are summed against the total', () => {
      then('it reconciles', () => {
        expect(
          isRunCostBreakdownReconciled({
            cost: {
              input: '$0.012794320',
              cacheWrite: '$0.00',
              cacheRead: '$0',
              output: '$0.001124640',
              total: '$0.013918960',
            },
          }),
        ).toEqual(true);
      });
    });
  });

  given(
    '[case2] a spec-rate breakdown beside a billed total (an openrouter artifact)',
    () => {
      when('[t0] the parts are summed against the total', () => {
        then('it does not reconcile', () => {
          // verbatim from a 2026-10-05 openrouter/deepseek/flash run: the parts
          // price a cache read at the full input rate and sum to ~6x the charge
          expect(
            isRunCostBreakdownReconciled({
              cost: {
                input: '$0.000623100',
                cacheWrite: '$0.00',
                cacheRead: '$0.000384000',
                output: '$0.000452000',
                total: '$0.000236230',
              },
            }),
          ).toEqual(false);
        });
      });
    },
  );

  given('[case3] parts at a coarser precision than the total', () => {
    when('[t0] they sum to the same amount', () => {
      then('it reconciles — equality is by amount, never by words', () => {
        expect(
          isRunCostBreakdownReconciled({
            cost: {
              input: '$0.50',
              cacheWrite: '$0',
              cacheRead: '$0.02',
              output: '$0.10',
              total: '$0.620000000',
            },
          }),
        ).toEqual(true);
      });
    });
  });
});
