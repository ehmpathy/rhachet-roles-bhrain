// this file intentionally violates the arrow-only rubric with exactly ONE `function`
// keyword. one unambiguous violation keeps the review verdict deterministic (1 blocker,
// 0 nitpicks) so the negative-path acceptance/journey snapshots show real counts, not a
// masked placeholder (rule.forbid.snapshot-visual-blemishes).

export function calculateTotal(items: Array<{ price: number }>) {
  return items.reduce((total, item) => total + item.price, 0);
}
