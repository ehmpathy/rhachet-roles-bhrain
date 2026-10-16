import { asDidYouKnowLines } from '@src/domain.operations/asDidYouKnowLines';
import { emitReviewRefusal } from '@src/domain.operations/emitReviewRefusal';
import { ReviewRefusalEmittedError } from '@src/domain.operations/review/ReviewRefusalEmittedError';

import { HINT_OF_PLAN_WITHOUT_SPLIT } from './HINT_OF_PLAN_WITHOUT_SPLIT';

/**
 * .what = refuses a `--mode plan` run that has no partition split to preview
 * .why = a plan previews a split, so no split leaves naught to preview. ONE refusal, so the
 *        early flag check and the late check after a route set narrows to none print the
 *        same frame (rule.forbid.duplicate-format-tree-operations)
 *
 * .note = it emits on stderr and throws a `ReviewRefusalEmittedError`, so the cli does not
 *         print the frame twice
 */
export const refuseReviewPlanWithoutSplit = (): never => {
  emitReviewRefusal({
    kind: 'constraint',
    headline: '--mode plan previews a partition split, and none is declared',
    lines: asDidYouKnowLines({ rows: [HINT_OF_PLAN_WITHOUT_SPLIT] }),
  });
  throw new ReviewRefusalEmittedError('--mode plan requires --partition');
};
