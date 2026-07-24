import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import type { RouteStoneGuardBlockerReport } from '@src/domain.objects/Driver/RouteStoneGuardBlockerReport';

import { getRouteGuardReviewPeerContemplationStatus } from '../guard/review/peer/getRouteGuardReviewPeerContemplationStatus';
import { formatRouteGuardReviewPeerContemplatePrompt } from '../guard/tree/formatRouteGuardReviewPeerContemplatePrompt';
import { getOneStoneGuardApproval } from '../judges/getOneStoneGuardApproval';
import { asRouteDisplayPath } from './asRouteDisplayPath';
import { formatRouteDriveBudgetExhausted } from './formatRouteDriveBudgetExhausted';
import { getCurrentExhaustedSlugs } from './getCurrentExhaustedSlugs';

/**
 * .what = the ONE dispatcher for a stone's persisted guard-blocker message
 * .why = onBoot, onStop, and direct mode each need the same blocker message
 *        (approval / exhausted / uncontemplated). rather than triplicate the
 *        branch across all three surfaces (the pattern this replaces), each
 *        surface calls this once and applies only its own emit shape.
 *
 * .note = for VOLATILE blockers ('review.peer.exhausted', 'review.peer.uncontemplated')
 *         it RECOMPUTES live and returns null when the blocker is stale (budget
 *         extended, or the driver has since written the .taken), exactly as the
 *         extant branches did — a persist-only read would falsely re-block.
 *
 * .note = precedence (malfunction > constraint > exhausted > contemplation) is
 *         enforced at write-time: the blocker report carries ONE value, chosen
 *         by the highest-precedence gate in setStoneAsPassed. this dispatcher
 *         renders whichever single blocker was persisted.
 *
 * .note = `blocksStop` tells the onStop surface whether to block the stop
 *         (stderr code 2) or allow it (stdout only, exit 0):
 *         - approval / exhausted not-approved → allow stop (agent waits for human)
 *         - uncontemplated → block stop (agent can act now: write the .taken)
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

    return {
      stdout: formatRouteDriveBudgetExhausted({
        route,
        stone: stone.name,
        reason: `peer reviewer budget exhausted: ${exhaustedSlugs.join(', ')}`,
        meters,
      }),
      blocksStop: false,
    };
  }

  // blocked on absent peer contemplation → show the reviewers-await-reply prompt
  if (blockerReport?.blocker === 'review.peer.uncontemplated') {
    const stdout = await computeContemplationReplyPrompt({ stone, route });
    // driver has since written the .taken → blocker is stale, no message
    if (!stdout) return null;
    return { stdout, blocksStop: true };
  }

  // no dispatchable blocker → caller shows generic guidance
  return null;
};

/**
 * .what = live-recomputes the contemplation reply-prompt for a blocked stone
 * .why = the persisted 'review.peer.uncontemplated' blocker is only a TRIGGER;
 *        contemplation is satisfied by a single local .taken write between hook
 *        fires, so a persist-only read would falsely re-block a driver who just
 *        responded — recompute live and skip (null) when already satisfied
 */
const computeContemplationReplyPrompt = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<string | null> => {
  const status = await getRouteGuardReviewPeerContemplationStatus({
    route: input.route,
    stone: input.stone,
  });
  if (status.ready) return null;
  return formatRouteGuardReviewPeerContemplatePrompt({
    case: 'reply-prompt',
    stone: input.stone.name,
    reviewers: status.uncontemplated,
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
