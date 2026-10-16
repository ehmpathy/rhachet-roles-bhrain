import { emitReviewRefusal } from '@src/domain.operations/emitReviewRefusal';
import { ReviewRefusalEmittedError } from '@src/domain.operations/review/ReviewRefusalEmittedError';

import type { getOneReviewPartitionSplitVerdict } from './getOneReviewPartitionSplitVerdict';

/**
 * .what = acts on a partition split's verdict — refuses loud where the split cannot
 *         hold, warns on stderr where it holds with a caveat, and hands back the split
 * .why = the derivation is pure (`getOneReviewPartitionSplitVerdict`); the emit and the
 *        throw live here, under a verb that says it acts, so no `get` hides a side effect
 *
 * .note = `null` passes through — no declaration, no split to act on
 * .note = a refusal is a constraint: it is emitted on stderr and thrown as a
 *         `ReviewRefusalEmittedError` (a `BadRequestError`), so the caller fixes the
 *         declaration and the cli does not print the frame twice
 */
export const emitReviewPartitionSplitVerdict = (input: {
  verdict: ReturnType<typeof getOneReviewPartitionSplitVerdict>;
}): {
  split: NonNullable<
    ReturnType<typeof getOneReviewPartitionSplitVerdict>
  >['split'];
  costs: NonNullable<
    ReturnType<typeof getOneReviewPartitionSplitVerdict>
  >['costs'];
} | null => {
  // no declaration, no split
  if (!input.verdict) return null;
  const { split, costs, refusal, warnLines } = input.verdict;

  // refuse a split that cannot hold
  if (refusal) {
    emitReviewRefusal({ kind: 'constraint', ...refusal });
    throw new ReviewRefusalEmittedError(refusal.headline);
  }

  // warn on a split that holds with a caveat
  if (warnLines.length) console.error(warnLines.join('\n'));
  return { split, costs };
};
