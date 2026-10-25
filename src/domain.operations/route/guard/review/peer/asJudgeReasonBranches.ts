import { JUDGE_REASON_SHED_JOINER } from './asJudgeReasonWithShed';

/**
 * .what = splits a judge reason into its verdict head and one branch per axis a stance shed
 * .why = a tree shows one fact per leaf (rule.require.stdout-is-treestruct). the judge's `reason:`
 *        stdout carries the shed inline, since the guard parses that one line; a tree render nests
 *        each shed axis beneath the verdict instead, as its own branch
 *
 * .note = a reason with no shed returns no branches, so its render is byte for byte unchanged
 * .note = each shed segment ends in its `(N disputed + M conceded better)` parenthesis, so the
 *         segments part at `), ` — never at a bare comma, which the verdict's own parens hold
 */
export const asJudgeReasonBranches = (input: {
  reason: string;
}): { head: string; shed: string[] } => {
  const at = input.reason.indexOf(JUDGE_REASON_SHED_JOINER);

  // naught shed → the reason is all head
  if (at < 0) return { head: input.reason, shed: [] };

  const tail = input.reason.slice(at + JUDGE_REASON_SHED_JOINER.length);
  return {
    head: input.reason.slice(0, at),
    shed: tail.split(/(?<=\)), /).map((segment) => `after ${segment}`),
  };
};
