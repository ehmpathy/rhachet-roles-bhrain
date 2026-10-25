import { asConcernCountPhrase } from './asConcernCountPhrase';

/**
 * .what = renders the judge's shed arithmetic — what disputes and `better` concessions shed, and
 *         what remains
 * .why = `--as disputed|conceded --about <concern>` is a per-CONCERN command whose effect is a
 *        STONE-WIDE sum, so a driver can declare a correct stance and see the stone still held.
 *        the residual is the one quantity they cannot derive at a glance, and with it unprinted
 *        the hold reads two ways (rule.forbid.ambiguous-labels).
 *
 * 🔴 the `better` shed is printed too. a judge that shed conceded-`better` concerns in silence
 *    left a lapsed stance indistinguishable from a live one: the halt read a bare `3 > 0`, with no
 *    line to say the three were never shed. one line per shed kind makes that visible
 *
 * .note = it renders NAUGHT where no stance moved the sum. the lines answer *"did my stance
 *         work?"*, and a driver who declared no shed-able stance never asked.
 *
 * .why named = it lived inline in the `reviewed?` judge, so the one render a driver reads at
 *         the moment of highest confusion was reachable only through the cli and had no test
 *         at any grain (r10 b1). as a transformer it is pure, and its bytes are pinned.
 */
export const asJudgeResidualLines = (input: {
  /** what the driver's disputes excluded from the tally */
  disputed: { blockers: number; nitpicks: number };

  /** what the driver's live `better` concessions on exhausted lanes excluded from the tally */
  concededBetter: { blockers: number; nitpicks: number };

  /** what remains after the exclusion — already clamped at zero by its own operation */
  residual: { blockers: number; nitpicks: number };

  allowBlockers: number;
  allowNitpicks: number;
}): string[] => {
  const movedByDispute =
    input.disputed.blockers > 0 || input.disputed.nitpicks > 0;
  const movedByBetter =
    input.concededBetter.blockers > 0 || input.concededBetter.nitpicks > 0;
  if (!movedByDispute && !movedByBetter) return [];

  return [
    ...(movedByDispute
      ? [
          `disputed: ${asConcernCountPhrase({ count: input.disputed.blockers, kind: 'blockers' })}, ${asConcernCountPhrase({ count: input.disputed.nitpicks, kind: 'nitpicks' })} excluded from the tally`,
        ]
      : []),
    ...(movedByBetter
      ? [
          `conceded better: ${asConcernCountPhrase({ count: input.concededBetter.blockers, kind: 'blockers' })}, ${asConcernCountPhrase({ count: input.concededBetter.nitpicks, kind: 'nitpicks' })} excluded from the tally`,
        ]
      : []),
    `residual: ${input.residual.blockers}/${input.allowBlockers} blockers, ${input.residual.nitpicks}/${input.allowNitpicks} nitpicks`,
  ];
};
