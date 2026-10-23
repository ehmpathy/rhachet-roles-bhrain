import type { ReviewRunGrade } from '@src/domain.objects/Reviewer/ReviewRunMeter';

/**
 * .what = grades how much of an unmetered run's spend the log corpus can prove
 * .why = a run's cost is measured, refused, or unknown, never guessed. `refused`
 *        and `unknown` both mean "no `metrics.realized.json`", but render as
 *        opposites: `refused` is a nil that is a fact and prints `$0`; `unknown`
 *        is an absence and prints absent, excluded from every sum. `refused` is
 *        earned only where NO witness proves the run got past validation.
 *
 * .note = the prompt alone is a weak witness. it is the largest artifact in the
 *         dir — a review prompt runs to megabytes, and a grove mine once read
 *         ~2.8gb and died at a 2gb heap — so a disk-conscious prune of prompt files
 *         is routine, and a prune must never flip "unrecorded" to "measured nil"
 *         (rule.forbid.failhide).
 *
 * .note = `metrics.compiled.json` is the witness that survives the prune. `stepReview`
 *         writes it in the same call as the prompt, and a run refused at validation
 *         writes neither — so a compiled file proves the run got past validation,
 *         and it is kilobytes, so nobody prunes it for disk.
 */
export const getOneReviewRunGrade = (input: {
  /** whether `input.prompt.md` is still on disk */
  promptPresent: boolean;
  /** whether `metrics.compiled.json` is on disk — written beside the prompt */
  compiledPresent: boolean;
  /**
   * whether the brain's answer survives — `output.response.json` or `output.review.md`
   *
   * the strongest witness of the three: it IS the brain's reply, so it proves the
   * call was made and billed. it also predates `metrics.compiled.json`, so it is
   * the one witness an older run dir with a pruned prompt still carries.
   */
  answerPresent: boolean;
}): Extract<ReviewRunGrade, 'refused' | 'unknown'> => {
  // the brain's own answer survives — the call was made, so its spend is unrecorded
  if (input.answerPresent) return 'unknown';

  // the prompt survives — the brain may well have been called and billed
  if (input.promptPresent) return 'unknown';

  // the prompt was pruned, but its compiled peer survives. both are written in one
  // call past validation, so the run was not refused and its spend is unrecorded
  if (input.compiledPresent) return 'unknown';

  // no metrics, no answer, no prompt, no compiled — the run was refused at
  // validation before the brain was ever called, so a nil spend is a fact
  return 'refused';
};
