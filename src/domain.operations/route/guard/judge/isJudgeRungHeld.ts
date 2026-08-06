import type { ExitCodeClass } from '../getExitCodeClass';

/**
 * .what = decides whether the judge rung currently holds passage due to a MALFUNCTION
 * .why = the judge is the top rung of the guard ladder. once every peer level is
 *        clear-for-passage, a judge whose process MALFUNCTIONED (a crash/timeout, an exit
 *        outside the verdict set) is a broken rung the human must be able to overrule — the
 *        gap r11 flagged. a genuine constraint (exit 2, e.g. an approved? judge that awaits
 *        sign-off, or an absent credential) is NOT a malfunction: it has its own escape
 *        (`--as approved`, or a fix of the constraint), so it does not surface as an overrule
 *        target — that would regress the merit-clear no-op guard (case17).
 *
 * a judge that never ran (no verdict) does NOT hold. only the latest iteration's verdict
 * counts, so a prior malfunction a re-run cleared does not linger as a phantom hold.
 */
export const isJudgeRungHeld = (input: {
  judges: { iteration: number; exitClass: ExitCodeClass }[];
}): boolean => {
  // no judge verdict = the judge has not run = none is present to forgive
  if (input.judges.length === 0) return false;

  // consider only the latest iteration's verdicts — a re-run supersedes a prior verdict
  const latestIteration = Math.max(...input.judges.map((j) => j.iteration));

  // the judge rung holds when a judge at the latest iteration malfunctioned
  return input.judges
    .filter((j) => j.iteration === latestIteration)
    .some((j) => j.exitClass === 'malfunction');
};
