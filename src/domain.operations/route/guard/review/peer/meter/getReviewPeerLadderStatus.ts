import type { GuardPeerMeterStatus } from '../../../tree/formatGuardTree';
import type { ReviewPeerVerdict } from './computeReviewPeerVerdict';
import { isReviewPeerVerdictTerminal } from './isReviewPeerLevelTerminal';

/**
 * .what = one terminal level in the ladder, with the representative verdict that
 *         earned its terminal state (the most-escalated verdict at the level)
 * .why = the footer names WHY a level no longer blocks — "l1 is terminal (exhausted)"
 */
export interface ReviewPeerLadderLevelTerminal {
  level: number;
  verdict: ReviewPeerVerdict;
}

/**
 * .what = the ladder's terminal/live shape, derived from the peer meters
 * .why = the "path continues" footer needs to say which levels are DONE (terminal),
 *        which level is NOW LIVE (the active gate), and whether the whole ladder is
 *        spent — all three read from the SAME peerMeters the tree already renders, so
 *        the footer can never drift from the reviewer lines above it
 *        (rule.require.single-source-of-truth-for-render)
 */
export interface ReviewPeerLadderStatus {
  /** levels where every reviewer is terminal, low-to-high, each with a representative verdict */
  terminalLevels: ReviewPeerLadderLevelTerminal[];
  /** the lowest non-terminal level — the active gate now — or null when every level is terminal */
  liveLevel: number | null;
  /** every level is terminal (no live gate remains) */
  allTerminal: boolean;
  /**
   * a lower level went terminal via a HUMAN-DEFERRABLE verdict (approved or exhausted) and a
   * HIGHER level is now the live gate — the true "path continues" unlock moment
   * (lower-unlocks-higher). the sole gate the ladder footer reads. false when:
   * - the live gate sits below every terminal level (a regression state, e.g. a higher level
   *   approved via overrule while a lower level re-rejects) — NOT an unlock, so the footer must
   *   not name the base level as "now live"; OR
   * - any terminal level is malfunction/constraint — those need a human NOW (to overrule or fix
   *   the broken reviewer), which contradicts the footer's "a human is only needed once every
   *   level is terminal" line. only exhaustion/approval legitimately DEFER the human; a
   *   malfunction/constraint halt's own remedy block ("overrule the malfunction") carries the
   *   guidance instead, so the footer stays silent.
   */
  unlockTransition: boolean;
}

/** verdict precedence for a level's representative label — most-escalated first */
const VERDICT_ESCALATION_ORDER: ReviewPeerVerdict[] = [
  'malfunction',
  'constraint',
  'exhausted',
  'approved',
];

/**
 * .what = whether a terminal verdict lets the driver DEFER the human (vs need one now)
 * .why = the footer promises "a human is only needed once every level is terminal" — true only
 *        when the terminal levels are approved or exhausted (the driver did all it could, or the
 *        level passed clean). a malfunction/constraint is terminal-for-unlock too, but it needs a
 *        human NOW (overrule the broken reviewer / lift the constraint), so it does NOT defer the
 *        human — the footer stays silent there, so the halt's own remedy block guides instead.
 */
const isReviewPeerVerdictDeferrable = (verdict: ReviewPeerVerdict): boolean =>
  verdict === 'approved' || verdict === 'exhausted';

/**
 * .what = the single representative verdict for a terminal level
 * .why = a level can hold several reviewers with different terminal verdicts; the footer
 *        shows one, and the human most needs the most-escalated (a malfunction outranks an
 *        approved) — so the parenthetical names the verdict that most warrants attention
 */
const asRepresentativeTerminalVerdict = (
  verdicts: ReviewPeerVerdict[],
): ReviewPeerVerdict => {
  for (const candidate of VERDICT_ESCALATION_ORDER)
    if (verdicts.includes(candidate)) return candidate;
  // every terminal verdict is in the escalation order, so this is unreachable in practice;
  // fall back to the first present verdict to stay total
  return verdicts[0] ?? 'approved';
};

/**
 * .what = derives the ladder's terminal/live shape from the current peer meters
 * .why = one transformer computes what the footer and any caller need to know about the
 *        ladder — which levels are done, which is live, whether all are spent — so the
 *        guidance is a read of the meters, never a hand-rolled re-derivation
 */
export const getReviewPeerLadderStatus = (input: {
  peerMeters: GuardPeerMeterStatus[];
}): ReviewPeerLadderStatus => {
  // unique levels, low-to-high — the ladder rungs in order
  const levels = [...new Set(input.peerMeters.map((m) => m.level))].sort(
    (a, b) => a - b,
  );

  const terminalLevels: ReviewPeerLadderLevelTerminal[] = [];
  let liveLevel: number | null = null;

  for (const level of levels) {
    const atLevel = input.peerMeters.filter((m) => m.level === level);
    const levelTerminal = atLevel.every((m) =>
      isReviewPeerVerdictTerminal(m.verdict),
    );

    // a terminal level joins the "done" list with its representative verdict
    if (levelTerminal) {
      terminalLevels.push({
        level,
        verdict: asRepresentativeTerminalVerdict(atLevel.map((m) => m.verdict)),
      });
      continue;
    }

    // the first non-terminal level is the live gate (lowest, since levels sort low-to-high)
    if (liveLevel === null) liveLevel = level;
  }

  // the unlock moment: a terminal level sits BELOW the live gate (lower-unlocks-higher) AND
  // every terminal level is human-DEFERRABLE (approved or exhausted). false when:
  // - no terminal level is below the live gate (a regression state, not an unlock), OR
  // - any terminal level is malfunction/constraint — those need a human NOW, so the footer's
  //   "human only needed once all terminal" would contradict the halt's "overrule now" remedy.
  const unlockTransition =
    liveLevel !== null &&
    terminalLevels.some((terminal) => terminal.level < liveLevel) &&
    terminalLevels.every((terminal) =>
      isReviewPeerVerdictDeferrable(terminal.verdict),
    );

  return {
    terminalLevels,
    liveLevel,
    allTerminal: liveLevel === null && terminalLevels.length > 0,
    unlockTransition,
  };
};
