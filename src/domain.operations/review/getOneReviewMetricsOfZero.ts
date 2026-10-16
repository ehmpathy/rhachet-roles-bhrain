import { asIsoPriceHuman } from 'iso-price';

import type { StepReviewResult } from '@src/domain.operations/review/StepReviewResult';

/**
 * .what = the metrics of a run that called no brain — every count, token, and price a real zero
 * .why = a skip and a plan both return a result with no brain call behind it. one source keeps
 *        the two in step with the run that shares their type: a token axis or a cost field
 *        added to `StepReviewResult` lands here once, never in one copy and not the other
 *        (rule.require.single-source-of-truth-for-render)
 */
export const getOneReviewMetricsOfZero = (): StepReviewResult['metrics'] => {
  const zeroPrice = asIsoPriceHuman({ amount: 0, currency: 'USD' });
  return {
    files: {
      rulesCount: 0,
      refsCount: 0,
      conversationCount: 0,
      targetsCount: 0,
    },
    expected: {
      tokens: { estimate: 0, contextWindowPercent: 0 },
      cost: { estimate: zeroPrice },
    },
    realized: {
      tokens: {
        input: 0,
        inputCacheCreation: 0,
        inputCacheRead: 0,
        output: 0,
      },
      cost: {
        input: zeroPrice,
        cacheWrite: zeroPrice,
        cacheRead: zeroPrice,
        output: zeroPrice,
        total: zeroPrice,
      },
      // 'PT0S' is a compile-time-validated IsoDurationWords literal (rule.forbid.as-cast)
      time: 'PT0S',
    },
  };
};
