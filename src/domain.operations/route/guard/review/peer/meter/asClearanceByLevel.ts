import type { ReviewPeerVerdict } from './computeReviewPeerVerdict';
import {
  getStoneGuardLevelClearance,
  type StoneGuardLevelClearance,
} from './getStoneGuardLevelClearance';

/**
 * .what = each review level's clearance, keyed by its level, derived from the lanes' verdicts
 * .why = the status render looks up clearance per level; one name states that lookup, so the
 *        orchestrator reads as a narrative (rule.forbid.decode-friction-in-orchestrators)
 * .note = reads the shared clearance primitive, so the `awaits` line cannot drift from the
 *         unlock filter and judge that read the same source
 */
export const asClearanceByLevel = (input: {
  lanes: Array<{ reviewer: { level: number }; verdict: ReviewPeerVerdict }>;
  overruledLevels: Set<number>;
}): Map<number, StoneGuardLevelClearance> =>
  new Map(
    getStoneGuardLevelClearance({
      reviewers: input.lanes.map((lane) => ({
        level: lane.reviewer.level,
        verdict: lane.verdict,
      })),
      overruledLevels: input.overruledLevels,
    }).map((clearance) => [clearance.level, clearance]),
  );
