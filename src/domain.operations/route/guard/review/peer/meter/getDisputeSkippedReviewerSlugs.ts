import type { GuardPeerMeterStatus } from '../../../tree/formatGuardTree';

/**
 * .what = the slugs of the reviewers a DISPUTE has taken out of this generation's round
 * .why = the budget emit must name a lane it left dark, and the guard tree must mark one. both
 *        read the same question — "which lanes are quiet right now?" — off the same meter list, so
 *        a named transformer keeps each orchestrator as narrative
 *        (rule.forbid.inline-decode-friction) and the read single-sourced
 *        (rule.require.single-source-of-truth-for-render).
 *
 * 🔴 .note = it reads `skippedByDispute`, NEVER a `disputed > 0` count. the two diverge on the
 *        exact case `case=4`'s F024 fork names: a lane at 3 blockers with 1 disputed still holds
 *        the road on its residual, so it RUNS with its dispute unresolved. a count-based read
 *        would paint that lane quiet and the emit would promise a silence that never comes.
 *
 * .note = no `overruledLevels` parameter, unlike its exhaustion peer. a forgive and a dispute are
 *        independent and they compose (`case=4` `[t3]`) — a human who waves a level through does
 *        not un-skip a lane the driver disputed, so no caller has yet wanted the subtraction. add
 *        the parameter when one does, rather than guess at the semantics now
 *        (rule.prefer.wet-over-dry).
 */
export const getDisputeSkippedReviewerSlugs = (input: {
  meters: GuardPeerMeterStatus[];
}): string[] =>
  input.meters
    .filter((meter) => meter.skippedByDispute)
    .map((meter) => meter.slug);
