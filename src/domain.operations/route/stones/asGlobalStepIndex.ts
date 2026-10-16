/**
 * .what = a guard step's position across the whole guard — reviews first, then judges
 * .why = each phase counts its steps from zero; the progress tree numbers every step on one
 *        axis, so a judge step sits after every review step
 */
export const asGlobalStepIndex = (input: {
  step: { phase: 'review' | 'judge'; index: number };
  totalReviews: number;
}): number => {
  // a review step's index is already global, since reviews lead
  if (input.step.phase === 'review') return input.step.index;

  // a judge step is offset by every review ahead of it
  return input.totalReviews + input.step.index;
};
