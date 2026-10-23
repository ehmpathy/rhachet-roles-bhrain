/**
 * .what = reads the explicit `passed:` and `reason:` marks a judge prints
 * .why = one home for the judge output grammar: the guard's live run, its cached read, and
 *        the artifact census all derive a judge's verdict from the same two lines
 *        (rule.require.single-source-of-truth-for-render)
 *
 * .note = an absent mark reads as null; each caller decides its own fallback (exit code,
 *         stderr) for a judge that printed no mark
 */
export const asGuardJudgeVerdictMarks = (input: {
  content: string;
}): { passed: boolean | null; reason: string | null } => {
  const passedMatch = input.content.match(/passed:\s*(true|false)/i);
  const reasonMatch = input.content.match(/reason:\s*(.+)/i);
  return {
    passed: passedMatch?.[1] ? passedMatch[1].toLowerCase() === 'true' : null,
    reason: reasonMatch?.[1] ? reasonMatch[1].trim() : null,
  };
};
