import { asRealizedTokensFromReviewTokens } from '@src/domain.operations/review/asRealizedTokensFromReviewTokens';
import { asReviewTokensFromRealized } from '@src/domain.operations/review/asReviewTokensFromRealized';
import { getOneReviewCostsSummed } from '@src/domain.operations/review/getOneReviewCostsSummed';
import { getOneReviewTokensSummed } from '@src/domain.operations/review/getOneReviewTokensSummed';
import { isFaultOfUnbilledCall } from '@src/domain.operations/review/isFaultOfUnbilledCall';
import type { StepReviewResult } from '@src/domain.operations/review/StepReviewResult';

type ReviewRunRealized = StepReviewResult['metrics']['realized'];

/**
 * .what = a run's realized figures, narrowed to a measured spend
 */
type ReviewRunRealizedMeasured = ReviewRunRealized & {
  tokens: NonNullable<ReviewRunRealized['tokens']>;
  cost: NonNullable<ReviewRunRealized['cost']>;
};

/**
 * .what = whether a run's spend was measured — its cost and its tokens both known
 * .why = a type predicate, so the filter narrows away the nulls of an unmeasured spend.
 *        `asReviewRunMetricsRealizedOfResult` nulls both at once, so one test reads both
 */
const isRealizedSpendMeasured = (
  realized: ReviewRunRealized,
): realized is ReviewRunRealizedMeasured =>
  realized.cost !== null && realized.tokens !== null;

/**
 * .what = the realized cost and token counts of a split lane — each summed over its runs,
 *         or ALL null where the lane's spend is unmeasured
 * .why = 🔴 a sum that skipped an unmeasured run, or a run that threw after it was billed,
 *        would state a total too low, beside a meter that grades that run `unknown`. one
 *        unknown part makes the whole unknown (`0.wish`: never under-report), so the lane's
 *        figures render absent, never low — the input-side tokens as much as the output
 * .note = "is the spend measured" is decided ONCE, and every figure derives from that one
 *         answer, so the lane can never show a cost or an input count beside an absent
 *         output count, or the reverse
 */
export const getOneSpendOfPartitionRuns = (input: {
  /** each run's realized figures, the one part of a run this reads */
  runs: { metrics: { realized: ReviewRunRealized } }[];
  faults: { error: unknown }[];
}): {
  tokens: ReviewRunRealized['tokens'];
  cost: ReviewRunRealized['cost'];
} => {
  // the lane's spend is measured only where every run measured it and no fault was billed
  const spendsMeasured = input.runs
    .map((result) => result.metrics.realized)
    .filter(isRealizedSpendMeasured);
  const isLaneSpendMeasured =
    spendsMeasured.length === input.runs.length &&
    input.faults.every(isFaultOfUnbilledCall);
  if (!isLaneSpendMeasured) return { tokens: null, cost: null };

  // every run measured, and every fault unbilled: each figure folds through its one sum law;
  // tokens fold in the domain shape, then return to the disk shape
  const tokens = getOneReviewTokensSummed({
    tokens: spendsMeasured.map((spend) =>
      asReviewTokensFromRealized({ tokens: spend.tokens }),
    ),
  });
  return {
    tokens: asRealizedTokensFromReviewTokens({ tokens }),
    cost: getOneReviewCostsSummed({
      costs: spendsMeasured.map((spend) => spend.cost),
    }),
  };
};
