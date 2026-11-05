/**
 * .what = splits a whole token count across weights, in integers, with no token lost
 * .why = every row of the inventory must sum to the measured total; a naive round per
 *        share drifts by a token per row. largest-remainder keeps the sum exact
 */
export const asTokenAllocation = (input: {
  total: number;
  weights: number[];
}): number[] => {
  const weightSum = input.weights.reduce((sum, weight) => sum + weight, 0);
  if (input.total <= 0 || weightSum <= 0) return input.weights.map(() => 0);

  // floor each exact share, then hand the leftover to the largest fractions
  const exacts = input.weights.map(
    (weight) => (input.total * weight) / weightSum,
  );
  const floors = exacts.map((exact) => Math.floor(exact));
  const leftover = input.total - floors.reduce((sum, floor) => sum + floor, 0);
  const rankedByFraction = exacts
    .map((exact, index) => ({ index, fraction: exact - Math.floor(exact) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  const bonusIndexes = new Set(
    rankedByFraction.slice(0, leftover).map((entry) => entry.index),
  );
  return floors.map(
    (floor, index) => floor + (bonusIndexes.has(index) ? 1 : 0),
  );
};
