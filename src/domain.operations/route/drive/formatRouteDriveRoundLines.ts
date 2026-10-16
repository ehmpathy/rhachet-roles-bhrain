import { asStoneGuardCounter } from '../guard/asStoneGuardCounter';
import {
  formatReviewsMeterLines,
  type GuardPeerMeterStatus,
} from '../guard/tree/formatGuardTree';

/**
 * .what = whether a lane approved with naught to say — no blocker, no nitpick, no declared mark
 * .why = such a lane owes the driver no read and no `.taken`, so the round block folds it into
 *        one count rather than spend two lines on it. an overruled or a disputed lane carries a
 *        declared mark a reader must see, so it never folds
 */
const isLaneApprovedClean = (input: { meter: GuardPeerMeterStatus }): boolean =>
  input.meter.verdict === 'approved' &&
  input.meter.blockers === 0 &&
  input.meter.nitpicks === 0 &&
  !input.meter.overruled &&
  !input.meter.skippedByDispute;

/**
 * .what = the one row that stands for every lane folded as approved-clean
 * .why = the fold must still be counted, or a reader cannot tell "12 lanes approved" from
 *        "12 lanes never ran"
 */
const asApprovedCleanRow = (input: { count: number }): string =>
  `${input.count} ${input.count === 1 ? 'lane' : 'lanes'} approved, 0 blockers ✓, 0 nitpicks ✓`;

/**
 * .what = the one row a judge's verdict on the round renders as
 * .why = the round's tally is the lanes; whether it held the stone is the judge's word, so the
 *        block names it beside them. the ✓ / ✗ marks are the guard tree's own judge marks
 */
const asJudgeRow = (input: {
  judge: { index: number; passed: boolean | null; reason: string | null };
}): string => {
  const { judge } = input;
  if (judge.passed === true) return `j${judge.index}: passed ✓`;
  if (judge.passed === null) return `j${judge.index}: no verdict recorded`;
  return judge.reason
    ? `j${judge.index}: blocked ✗ — ${judge.reason}`
    : `j${judge.index}: blocked ✗`;
};

/**
 * .what = the latest-round block route.drive renders above the stone: which lanes approved,
 *         rejected, or broke on the latest round, with their counts and given paths, and what
 *         the judge decided
 * .why = the round's full tree prints once, on the `route.stone.set` that ran it, and is gone
 *        when that stdout is. this block is the durable replay, in compact rows, so a driver
 *        reads the round's state at a glance without a hand-built tally over the givens
 *
 * .note = each lane row is the SHARED reviewer render (formatReviewsMeterLines →
 *         formatGuardReviewerTree), in its compact density — never a second row layout
 *         (rule.forbid.duplicate-format-tree-operations). the block adds only the fold row and
 *         the judge rows beneath the lanes
 */
export const formatRouteDriveRoundLines = (input: {
  round: {
    iteration: number;
    meters: GuardPeerMeterStatus[];
    judges: { index: number; passed: boolean | null; reason: string | null }[];
  };
}): string[] => {
  const { round } = input;

  // split the lanes: those a reader must see, and those that fold into one count
  const metersShown = round.meters.filter(
    (meter) => !isLaneApprovedClean({ meter }),
  );
  const countApprovedClean = round.meters.length - metersShown.length;

  // the rows beneath the lanes: the fold count, then each judge
  const rowsTail = [
    ...(countApprovedClean > 0
      ? [asApprovedCleanRow({ count: countApprovedClean })]
      : []),
    ...round.judges.map((judge) => asJudgeRow({ judge })),
  ];

  // the lane rows, via the shared reviewer render in compact density
  const laneLines = formatReviewsMeterLines({
    meters: metersShown,
    baseIndent: '   ',
    sectionIndent: '│  ',
    includeHeader: false,
    density: 'compact',
    closesSection: rowsTail.length === 0,
  });

  // the tail rows, at the same indent the lane rows hang at
  const tailLines = rowsTail.map(
    (row, index) =>
      `   │   ${index === rowsTail.length - 1 ? '└─' : '├─'} ${row}`,
  );

  return [
    `   ├─ latest round, i${asStoneGuardCounter({ value: round.iteration })}`,
    ...laneLines,
    ...tailLines,
    `   │`,
  ];
};
