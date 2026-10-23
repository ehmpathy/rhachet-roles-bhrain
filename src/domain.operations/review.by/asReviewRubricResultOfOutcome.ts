// a sanctioned exposure, declared in src/domain.operations/review/.readme.md
import { asErrorMessage } from '@src/domain.operations/review/asErrorMessage';

import type { ReviewRubric } from './asReviewRubricsConfig';
import type { ReviewRubricResult } from './ReviewByResult';

/**
 * .what = turns one rubric's settled outcome into its result row — a fulfilled outcome as
 *         itself, a rejected one as a named malfunction
 * .why = review.by pours its rubrics with a SETTLED pour, so a throw from one rubric never
 *        drops the verdicts its peers returned (rule.forbid.dropped-partial-review-progress).
 *        the rejected rubric must still answer — as a `malfunctioned` row that names the
 *        fault, never a silent 0/0 and never a gap in the tree (rule.forbid.failhide)
 *
 * .note = a rejection here is a throw outside the reviewer-fault allowlist of
 *         `getOneReviewRunSettled` — a defect in review.by itself, not a reviewer verdict.
 *         the row says so in its reason, and the full stack rides on stderr, so the defect
 *         reaches the human as itself rather than as a reviewer malfunction
 */
export const asReviewRubricResultOfOutcome = (input: {
  outcome: PromiseSettledResult<ReviewRubricResult>;
  rubric: ReviewRubric;
  outputPath: string;
}): ReviewRubricResult => {
  // a rubric that returned keeps its own row, untouched
  if (input.outcome.status === 'fulfilled') return input.outcome.value;

  // a rubric whose run threw answers as a named malfunction, with the defect's stack
  const reason = `UnexpectedCodePathError: review.by threw on this rubric — a defect in review.by, not a reviewer verdict: ${asErrorMessage({ error: input.outcome.reason })}`;
  const stack =
    input.outcome.reason instanceof Error
      ? (input.outcome.reason.stack ?? '')
      : '';
  return {
    slug: input.rubric.slug,
    purpose: input.rubric.purpose,
    verdict: {
      blockers: 0,
      nitpicks: 0,
      outcome: 'malfunctioned',
      tallier: null,
      talliedBy: null,
      reason,
    },
    outputPath: input.outputPath,
    durationMs: null,
    stdout: '',
    stderr: [`💥 ${reason}`, stack].filter((line) => line !== '').join('\n'),
  };
};
