import { asConcernCountPhrase } from './asConcernCountPhrase';

/**
 * .what = appends what the judge shed, per axis, to a verdict's reason — on a pass or a hold
 * .why = the `reason:` line is the one line of the judge a driver meets — route.drive and the
 *        `--as passed` halt render it, and never the judge's stderr. a pass over red blockers, or a
 *        hold that a stance shrank, must say so on the surface read
 *
 * .note = one zero policy with `asJudgeResidualLines`: an axis no stance moved renders naught, so a
 *         stone with no stance keeps its reason byte for byte
 * .note = no axis is re-derived from the verdict; each axis that shed renders its own segment
 */
export const asJudgeReasonWithShed = (input: {
  /** the verdict reason, as `computeReviewThresholdVerdict` phrased it */
  reason: string;

  /** what the driver's disputes excluded from the tally */
  disputed: { blockers: number; nitpicks: number };

  /** what the driver's live `better` concessions excluded from the tally */
  concededBetter: { blockers: number; nitpicks: number };
}): string => {
  // one segment per axis that a stance moved
  const segments = (['blockers', 'nitpicks'] as const)
    .filter((axis) => input.disputed[axis] + input.concededBetter[axis] > 0)
    .map(
      (axis) =>
        `${asConcernCountPhrase({ count: input.disputed[axis] + input.concededBetter[axis], kind: axis })} shed (${input.disputed[axis]} disputed + ${input.concededBetter[axis]} conceded better)`,
    );

  // naught shed → the reason stands as the verdict phrased it
  if (segments.length === 0) return input.reason;
  return `${input.reason}, after ${segments.join(', ')}`;
};
