/**
 * .what = renders the blocked reason from the judges that failed
 * .why = one home for the reason line: each judge's own reason, else a line that names its
 *        index, joined by `; ` so the passage report reads every gate that held
 */
export const asFailedJudgeReasons = (input: {
  judges: { reason: string | null; index: number }[];
}): string =>
  input.judges
    .map((judge) => judge.reason || `judge ${judge.index} failed`)
    .join('; ');
