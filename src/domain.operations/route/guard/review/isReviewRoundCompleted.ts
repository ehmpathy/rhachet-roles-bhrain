import type { ExitCodeClass } from '@src/domain.objects/Driver/ExitCodeClass';

/**
 * .what = decides whether a peer review round ran to a verdict, and so spends one budget round
 * .why = this rule gates the meter write — the budget a reviewer has left. a constraint exit
 *        with blockers is a review that worked and found issues; a constraint exit with none
 *        is a genuine constraint (an absent api key, say), which ran no review and spends naught
 */
export const isReviewRoundCompleted = (input: {
  review: { exitClass: ExitCodeClass; blockers: number };
}): boolean => {
  // a clean pass spent a round
  if (input.review.exitClass === 'passed') return true;

  // a constraint spent a round only when it carried blockers
  return input.review.exitClass === 'constraint' && input.review.blockers > 0;
};
