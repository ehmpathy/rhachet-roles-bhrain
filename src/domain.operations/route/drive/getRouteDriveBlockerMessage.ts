import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import type { RouteStoneGuardBlockerReport } from '@src/domain.objects/Driver/RouteStoneGuardBlockerReport';

import { getRepoRootWithFallback } from '../guard/getRepoRootWithFallback';
import { genRouteGuardExhaustedReason } from '../guard/review/peer/genRouteGuardExhaustedReason';
import { getStoneConcessionExhaustionKind } from '../guard/review/peer/getStoneConcededLaneSlugs';
import { getStoneGuardReviewPeerFeedbackUnabsorbedUnforgiven } from '../guard/review/peer/getStoneGuardReviewPeerFeedbackUnabsorbedUnforgiven';
import { getStoneUndeclaredConcerns } from '../guard/review/peer/getStoneUndeclaredConcerns';
import { formatRouteGuardReviewPeerAbsorptionPrompt } from '../guard/tree/formatRouteGuardReviewPeerAbsorptionPrompt';
import { formatRouteGuardReviewPeerFeedbackAbsorbPrompt } from '../guard/tree/formatRouteGuardReviewPeerFeedbackAbsorbPrompt';
import { getOneStoneGuardApproval } from '../judges/getOneStoneGuardApproval';
import { asRouteDisplayPath } from './asRouteDisplayPath';
import { formatRouteDriveBudgetExhausted } from './formatRouteDriveBudgetExhausted';
import { getCurrentExhaustedSlugs } from './getCurrentExhaustedSlugs';

/**
 * .what = the ONE dispatcher for a stone's persisted guard-blocker message
 * .why = onBoot, onStop, and direct mode each need the same blocker message
 *        (approval / exhausted / feedbackUnabsorbed / undeclared). rather than triplicate the
 *        branch across all three surfaces (the pattern this replaces), each
 *        surface calls this once and applies only its own emit shape.
 *
 * .note = for VOLATILE blockers ('review.peer.exhausted', 'review.peer.unabsorbed',
 *         'review.peer.undeclared') it RECOMPUTES live and returns null when the blocker
 *         is stale (budget extended, the driver has since written the .taken, or they
 *         have since declared a stance) — a persist-only read would falsely re-block.
 *
 * .note = precedence (malfunction > constraint > exhausted > feedbackAbsorption > stance) is
 *         enforced at write-time: the blocker report carries ONE value, chosen
 *         by the highest-precedence gate in setStoneAsPassed. this dispatcher
 *         renders whichever single blocker was persisted.
 *
 * .note = `blocksStop` tells the onStop surface whether to block the stop
 *         (stderr code 2) or allow it (stdout only, exit 0):
 *         - approval / exhausted not-approved → allow stop (agent waits for human)
 *         - feedbackUnabsorbed → block stop (agent can act now: write the .taken)
 *         - undeclared → block stop (agent can act now: declare a stance per concern)
 */
export const getRouteDriveBlockerMessage = async (input: {
  blockerReport: RouteStoneGuardBlockerReport | null;
  stone: RouteStone;
  route: string;
}): Promise<{ stdout: string; blocksStop: boolean } | null> => {
  const { blockerReport, stone, route } = input;

  // blocked on human approval → show approval-needed message (unless already granted)
  if (blockerReport?.blocker === 'approval') {
    const approvalArtifact = await getOneStoneGuardApproval({ stone, route });
    // approval granted → no message; caller falls through (generic guidance / block-stop)
    if (approvalArtifact) return null;
    return {
      stdout: formatRouteDriveNeedsApproval({ route, stone: stone.name }),
      blocksStop: false,
    };
  }

  // blocked on exhausted peer review budget → show budget-exhausted message
  if (blockerReport?.blocker === 'review.peer.exhausted') {
    const approvalArtifact = await getOneStoneGuardApproval({ stone, route });
    // approval granted → no message; caller falls through
    if (approvalArtifact) return null;

    // recompute current exhausted slugs (budget may have been extended since blocker was set)
    const { exhaustedSlugs, meters } = await getCurrentExhaustedSlugs({
      stone,
      route,
    });
    // no reviewer currently exhausted → blocker is stale, no message
    if (exhaustedSlugs.length === 0) return null;

    // recompute the concession mark LIVE, over the currently-exhausted set — the same
    // read the exhausted-STATUS surface (getRouteDriveExhaustedMessage) and the write gate
    // (setStoneAsPassed) both use. a stance is volatile: the driver may have conceded since
    // the halt, or a lane may have spoken again and lapsed the stance, so a replayed mark
    // would render a concession halt that no longer holds (S12).
    // ⚠️ the kind is three-way (F028/S14): `none` (a lane the driver never conceded still
    //    awaits a human), `better` (all conceded, floor met — the driver's own), or `urgent`
    //    (all conceded, ≥1 urgent — a warned human wait). the concession words fire only for
    //    a `better`/`urgent` set, and the urgent warn only for `urgent`.
    const concession = await getStoneConcessionExhaustionKind({
      route,
      stone: stone.name,
      slugs: exhaustedSlugs,
    });

    return {
      stdout: formatRouteDriveBudgetExhausted({
        route,
        stone: stone.name,
        // 🔴 the ONE builder owns this contract string (rule.require.single-source-of-truth-for-render).
        reason: genRouteGuardExhaustedReason({
          slugs: exhaustedSlugs,
          concession,
        }),
        meters,
      }),
      blocksStop: false,
    };
  }

  // blocked on absent peer feedbackAbsorption → show the reviewers-await-reply prompt
  if (blockerReport?.blocker === 'review.peer.unabsorbed') {
    const stdout = await computeFeedbackAbsorptionReplyPrompt({ stone, route });
    // driver has since written the .taken → blocker is stale, no message
    if (!stdout) return null;
    return { stdout, blocksStop: true };
  }

  // blocked on an undeclared concern → show the stance prompt
  // .note = VOLATILE, exactly as feedbackUnabsorbed is: one `--as disputed` or
  //         `--as conceded` between hook fires satisfies it, so it recomputes live
  //         and returns null once every concern is declared
  if (blockerReport?.blocker === 'review.peer.undeclared') {
    const stdout = await computeAbsorptionPrompt({ stone, route });
    // driver has since declared → blocker is stale, no message
    if (!stdout) return null;
    // blocksStop: the driver can act NOW — both stances are their own lever
    return { stdout, blocksStop: true };
  }

  // no dispatchable blocker → caller shows generic guidance
  return null;
};

/**
 * .what = live-recomputes the stance prompt for a blocked stone
 * .why = the persisted 'review.peer.undeclared' blocker is only a TRIGGER; a stance is
 *        satisfied by a single local command between hook fires, so a persist-only read
 *        would falsely re-block a driver who just declared
 */
const computeAbsorptionPrompt = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<string | null> => {
  const undeclared = await getStoneUndeclaredConcerns({
    route: input.route,
    stone: input.stone,
  });

  // every concern is declared — or an overrule forgave the lanes that held the road
  if (undeclared.length === 0) return null;

  return formatRouteGuardReviewPeerAbsorptionPrompt({
    stone: input.stone.name,
    lanes: undeclared,
  });
};

/**
 * .what = live-recomputes the feedbackAbsorption reply-prompt for a blocked stone
 * .why = the persisted 'review.peer.unabsorbed' blocker is only a TRIGGER;
 *        feedbackAbsorption is satisfied by a single local .taken write between hook
 *        fires, so a persist-only read would falsely re-block a driver who just
 *        responded — recompute live and skip (null) when already satisfied
 */
const computeFeedbackAbsorptionReplyPrompt = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<string | null> => {
  // .note = reads through getStoneGuardReviewPeerFeedbackUnabsorbedUnforgiven, the same operation
  //         the two passage gates use, rather than the raw feedbackAbsorption status. that operation
  //         declares itself the ONE answer to "whom does the prompt name"; a raw read here was a
  //         second one, and it differed — it skipped the overrule filter (so the hook could name
  //         a reviewer a human had already forgiven) and it carried no level or retired flag
  const unforgiven = await getStoneGuardReviewPeerFeedbackUnabsorbedUnforgiven({
    route: input.route,
    stone: input.stone,
  });

  // nobody is owed — either the driver just answered, or an overrule forgave the rest
  if (unforgiven.length === 0) return null;

  // .note = read AFTER the early return, so a stophook with no reviewer to name pays
  //         no git subprocess on every fire
  const root = await getRepoRootWithFallback({ from: input.route });

  return formatRouteGuardReviewPeerFeedbackAbsorbPrompt({
    case: 'reply-prompt',
    stone: input.stone.name,
    root,
    reviewers: unforgiven,
  });
};

/**
 * .what = formats route.drive output when stone needs human approval
 * .why = allows agent to stop gracefully when blocked on human approval
 */
const formatRouteDriveNeedsApproval = (input: {
  route: string;
  stone: string;
}): string => {
  const approveCmd = `rhx route.stone.set --stone ${input.stone} --as approved`;
  const passCmd = `rhx route.stone.set --stone ${input.stone} --as passed`;
  const lines: string[] = [];
  lines.push(`🦉 where were we?`);
  lines.push('');
  lines.push(`🗿 route.drive`);
  lines.push(`   ├─ where do we go?`);
  lines.push(`   │  ├─ route = ${asRouteDisplayPath({ route: input.route })}`);
  lines.push(`   │  └─ stone = ${input.stone}`);
  lines.push(`   │`);
  lines.push(`   └─ halted, human approval required`);
  lines.push(`      ├─ please ask a human to`);
  lines.push(`      │  └─ ${approveCmd}`);
  lines.push(`      │`);
  lines.push(`      └─ once they do, run`);
  lines.push(`         └─ ${passCmd}`);
  return lines.join('\n');
};
