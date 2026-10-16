import { asIsoPriceShape, priceSub, priceSum } from 'iso-price';

/**
 * .what = whether a run's per-dimension cost sums to the total it was billed
 * .why = a per-dimension figure is a measurement only where it reconciles with the
 *        bill. a brain supplier may write a SPEC-RATE estimate per dimension and
 *        replace only the total with the charge it was sent — openrouter does
 *        exactly that (`asCashWithSupplyTotal`, rhachet-brains-openrouter). a
 *        quotient read off such a breakdown is a rate card, not the run's own rate,
 *        so any figure derived from it (the amount a cache saved) would state a
 *        projection as a measurement (rule.forbid.failhide).
 *
 * .note = exact equality, by amount, never by words: a breakdown that IS the bill
 *         sums to it to the last minor unit ('$0.012794320' + '$0.001124640' is
 *         '$0.013918960'), and two equal prices may carry different precision
 */
export const isRunCostBreakdownReconciled = (input: {
  cost: {
    input: string;
    cacheWrite: string;
    cacheRead: string;
    output: string;
    total: string;
  };
}): boolean => {
  // the sum of the four billed dimensions
  const sumOfParts = priceSum(
    input.cost.input,
    input.cost.cacheWrite,
    input.cost.cacheRead,
    input.cost.output,
  );

  // reconciled when the parts and the bill differ by zero minor units
  return asIsoPriceShape(priceSub(sumOfParts, input.cost.total)).amount === 0n;
};
