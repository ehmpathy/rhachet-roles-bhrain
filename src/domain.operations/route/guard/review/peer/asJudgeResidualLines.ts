/**
 * .what = renders the judge's dispute arithmetic — what a dispute shed, and what remains
 * .why = `--as disputed --about <concern>` is a per-CONCERN command whose effect is a
 *        STONE-WIDE sum, so a driver can perform a correct dispute and see the stone still
 *        held. the residual is the one quantity they cannot derive at a glance, and with it
 *        unprinted the hold reads two ways (rule.forbid.ambiguous-labels).
 *
 * .note = it renders NAUGHT where no dispute moved the sum. the lines answer *"did my
 *         dispute work?"*, and a driver who disputed no concern never asked.
 *
 * .why named = it lived inline in the `reviewed?` judge, so the one render a driver reads at
 *         the moment of highest confusion was reachable only through the cli and had no test
 *         at any grain (r10 b1). as a transformer it is pure, and its bytes are pinned.
 */
export const asJudgeResidualLines = (input: {
  /** what the driver's disputes excluded from the tally */
  disputed: { blockers: number; nitpicks: number };

  /** what remains after the exclusion — already clamped at zero by its own operation */
  residual: { blockers: number; nitpicks: number };

  allowBlockers: number;
  allowNitpicks: number;
}): string[] => {
  const moved = input.disputed.blockers > 0 || input.disputed.nitpicks > 0;
  if (!moved) return [];

  return [
    `disputed: ${input.disputed.blockers} blockers, ${input.disputed.nitpicks} nitpicks excluded from the tally`,
    `residual: ${input.residual.blockers}/${input.allowBlockers} blockers, ${input.residual.nitpicks}/${input.allowNitpicks} nitpicks`,
  ];
};
