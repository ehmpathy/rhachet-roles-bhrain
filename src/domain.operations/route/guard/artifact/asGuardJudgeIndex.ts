/**
 * .what = reads the judge index a guard judge artifact's filename carries, or null if it
 *         carries none
 * .why = the judge artifact grammar ends each filename with `.jNNN.md` — the judge's declared
 *        index. a reader who sees the regex inline must simulate both the pattern and the
 *        capture index to learn what it returns, so the parse lives here under a name that
 *        says what it reads (rule.forbid.inline-decode-friction)
 */
export const asGuardJudgeIndex = (input: {
  filename: string;
}): number | null => {
  const marker = input.filename.match(/\.j(\d+)\.md$/)?.[1];
  if (marker === undefined) return null;
  return parseInt(marker, 10);
};
