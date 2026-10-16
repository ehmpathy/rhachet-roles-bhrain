import { asPeerReviewSlugFromPath } from './review/peer/asPeerReviewSlugFromPath';

/**
 * .what = the persisted reason of a guard malfunction — a header line, then one line
 *         per broken lane with its cause
 * .why = a malfunction is often PARTIAL: one lane of twenty-three timed out while the rest
 *        returned verdicts. the passage record is the one source every later surface reads
 *        (route.drive on stop and on boot), so if it records only `malfunction`, each of
 *        those surfaces can say no more than "it broke" — and a driver reads that as a wall
 *        for a human, when a transient fault clears with a re-arrive and every other lane's
 *        verdict still awaits an answer.
 *
 * .note = the shape is line-oriented on purpose: line 1 is the header, every later line is
 *         one lane. `asGuardMalfunctionReasonLines` is the one reader of that shape.
 */
export const asGuardMalfunctionReason = (input: {
  reviews: GuardMalfunctionLane[];
  judges: GuardMalfunctionLane[];
  reviewTotal: number;
  rejectedTotal: number;
}): string => {
  const header = asGuardMalfunctionHeader({
    reviewsBroken: input.reviews.length,
    judgesBroken: input.judges.length,
    reviewTotal: input.reviewTotal,
    rejectedTotal: input.rejectedTotal,
  });
  const lanes = [
    ...input.reviews.map((lane) =>
      asGuardMalfunctionLaneLine({ lane, kind: 'review' }),
    ),
    ...input.judges.map((lane) =>
      asGuardMalfunctionLaneLine({ lane, kind: 'judge' }),
    ),
  ];
  return [header, ...lanes].join('\n');
};

/**
 * .what = the minimum a broken lane must carry to be named in the reason
 * .why = declared structurally, so a review artifact and a judge artifact both fit
 */
export interface GuardMalfunctionLane {
  index: number;
  path: string;
  exitCode: number;
  stderr: string;
}

/**
 * .what = the header: how many lanes broke, out of how many, and what else is owed
 * .why = "2 of 23" is the fact a bare "malfunction" hides — that most lanes did return
 */
const asGuardMalfunctionHeader = (input: {
  reviewsBroken: number;
  judgesBroken: number;
  reviewTotal: number;
  rejectedTotal: number;
}): string => {
  const parts = [
    input.reviewsBroken > 0
      ? `${input.reviewsBroken} of ${input.reviewTotal} ${input.reviewTotal === 1 ? 'reviewer' : 'reviewers'} malfunctioned`
      : null,
    input.judgesBroken > 0
      ? `${input.judgesBroken} ${input.judgesBroken === 1 ? 'judge' : 'judges'} malfunctioned`
      : null,
    input.rejectedTotal > 0
      ? `${input.rejectedTotal} ${input.rejectedTotal === 1 ? 'reviewer rejected and awaits' : 'reviewers rejected and await'} your answer`
      : null,
  ].filter((part): part is string => part !== null);
  return parts.join('; ');
};

/**
 * .what = one broken lane, as `r14 repo-rules-briefs: review timed out after 20 minutes`
 * .why = the cause decides the lever — a timeout or a dropped socket clears with a re-run,
 *        an overflow with a guard edit — so the cause must survive into the record
 */
const asGuardMalfunctionLaneLine = (input: {
  lane: GuardMalfunctionLane;
  kind: 'review' | 'judge';
}): string => {
  const label =
    input.kind === 'review'
      ? `r${input.lane.index} ${asGuardMalfunctionLaneSlug({ path: input.lane.path, index: input.lane.index })}`
      : `j${input.lane.index}`;
  return `${label}: ${asGuardMalfunctionCause({ lane: input.lane })}`;
};

/**
 * .what = the reviewer slug a given's path carries, or `peer-N` where it carries none
 * .why = the artifact holds no slug field; the given's filename is where the slug lives,
 *        and `asPeerReviewSlugFromPath` is the one lenient reader of that grammar
 * .note = a lane's path is always the summary given, never its `.report.md` twin
 */
const asGuardMalfunctionLaneSlug = (input: {
  path: string;
  index: number;
}): string =>
  asPeerReviewSlugFromPath({ path: input.path }) ?? `peer-${input.index}`;

/**
 * .what = the cause a lane's stderr names, or its exit code where it names none
 * .why = every malfunction this repo throws opens with `💥 MalfunctionError: <cause>`,
 *        so the first such line is the cause a human would read off the given
 */
const asGuardMalfunctionCause = (input: {
  lane: GuardMalfunctionLane;
}): string =>
  /MalfunctionError: ([^\n]+)/.exec(input.lane.stderr)?.[1]?.trim() ??
  `exit code ${input.lane.exitCode}`;
