import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import { asDefectBodySansClassLabels } from '@src/domain.operations/review/meter/asDefectBodySansClassLabels';

/**
 * .what = builds the row for a run whose artifacts could not be read at all
 * .why = one corrupt log dir must not deny a report every other row. the throw
 *        is caught per run and turned into this row (rule.forbid.friction-hazards).
 *
 * .note = grade is `unknown`, never `refused` — `refused` renders `$0`, a measured
 *         nil, and would fold a corrupt run into the corpus as one that provably
 *         cost naught. `unknown` renders absent and excludes from every sum
 *         (rule.forbid.failhide).
 *
 * .note = the defect message rides on the row so the census can name the dir a
 *         human must repair.
 */
export const asReviewRunMeterOfDefect = (input: {
  dir: string;
  error: unknown;
}): ReviewRunMeter => ({
  dir: input.dir,
  identity: null,
  head: null,
  brain: null,
  provider: null,
  // the render names the class once in its own header, so the body carries none
  defect: asDefectBodySansClassLabels({ error: input.error }),
  grade: 'unknown',
  scope: null,
  tokens: null,
  cost: null,
  prompt: null,
});
