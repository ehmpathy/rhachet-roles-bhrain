import { asCountedNoun } from '@src/utils/asCountedNoun';

/**
 * .what = the caveat that names a spender a review-artifact fold does not sum
 *
 * .why = a warmer bills a real provider on a timer, and a fold over the
 *        review artifacts alone cannot see it. so `cost` at `tree` or `grove`
 *        is true about reviews and incomplete about the bill, and a silent
 *        omission is worse than an unanswerable question — it answers wrong
 *        with confidence. a driver who reads `$0.34` for a tree needs the cue
 *        that a second spender ran beside it.
 *
 * .why = it lives here, at the ancestor of `meter/` and `grove/`, because
 *        both folds owe the identical sentence. two copies of one render
 *        drift (`rule.require.single-source-of-truth-for-render`,
 *        `rule.prefer.most-common-denominator`).
 *
 * .note = it fires only where a warmer actually ran. a caveat on every report
 *         would grade a spender that never existed, and one a reader sees
 *         every time is one they learn to skip.
 *
 * .note = it names the excluded spend rather than folding it in — to add
 *         the pokes at `tree` while `grove` stays silent would make one
 *         figure mean two things across the `of` axis. the caveat closes
 *         the gap with a named exclusion, which is honest where a silent
 *         total is not.
 *
 * .note = it points at the breadth that does hold the figure, so the caveat names
 *         the fix rather than the symptom (`rule.require.errors-name-the-fix`).
 */
export const asWarmerCaveat = (input: { warmersSeen: number }): string => {
  const { warmersSeen } = input;
  if (warmersSeen === 0) return '';
  return `  🟡 EXCLUDES warmer pokes on ${asCountedNoun({ count: warmersSeen, one: 'run', many: 'runs' })} — weighed under \`warmer\` below`;
};
