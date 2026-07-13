import * as path from 'path';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import type { RouteStoneGuardBlockerReport } from '@src/domain.objects/Driver/RouteStoneGuardBlockerReport';

import { computeStoneReviewInputHash } from '../guard/review/computeStoneReviewInputHash';
import { getRouteGuardReviewPeerContemplationStatus } from '../guard/review/peer/getRouteGuardReviewPeerContemplationStatus';
import { getAllReviewPeerMeterStatuses } from '../guard/review/peer/meter/getAllReviewPeerMeterStatuses';
import { isReviewPeerVerdictExhausted } from '../guard/review/peer/meter/isReviewPeerLevelTerminal';
import {
  formatReviewsMeterLines,
  type GuardPeerMeterStatus,
} from '../guard/tree/formatGuardTree';
import { formatRouteGuardReviewPeerContemplatePrompt } from '../guard/tree/formatRouteGuardReviewPeerContemplatePrompt';
import { getOneStoneGuardApproval } from '../judges/getOneStoneGuardApproval';

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
    const { exhaustedSlugs, meters } = await computeCurrentExhaustedSlugs({
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
 * .what = computes currently exhausted reviewer slugs from current peerMeters
 * .why = blocker report reason may be stale (budget extended since recorded)
 */
const computeCurrentExhaustedSlugs = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<{
  exhaustedSlugs: string[];
  meters: GuardPeerMeterStatus[];
}> => {
  // compute current hash for this stone's artifacts
  const hash = await computeStoneReviewInputHash({
    stone: input.stone,
    route: input.route,
  });

  // get current peer meter statuses (uses current budget after any extensions)
  const peerMeters = await getAllReviewPeerMeterStatuses({
    stone: input.stone,
    hash,
    route: input.route,
  });

  // filter to currently exhausted
  const exhaustedSlugs = peerMeters
    .filter((m) => isReviewPeerVerdictExhausted(m.verdict))
    .map((m) => m.slug);

  return {
    exhaustedSlugs,
    meters: peerMeters,
  };
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
  lines.push(`   │  ├─ route = ${path.relative(process.cwd(), input.route)}`);
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

/**
 * .what = formats route.drive output when peer reviewer budget exhausted
 * .why = allows agent to stop gracefully when blocked on budget exhaustion
 */
const formatRouteDriveBudgetExhausted = (input: {
  route: string;
  stone: string;
  reason: string | null;
  meters: GuardPeerMeterStatus[];
}): string => {
  const approveCmd = `rhx route.stone.set --stone ${input.stone} --as approved`;
  const passCmd = `rhx route.stone.set --stone ${input.stone} --as passed`;

  // extract exhausted slugs from reason (format: "peer reviewer budget exhausted: slug1, slug2")
  const exhaustedSlugs: string[] = [];
  if (input.reason) {
    const match = input.reason.match(/budget exhausted:\s*(.+)$/);
    if (match?.[1]) {
      exhaustedSlugs.push(...match[1].split(',').map((s) => s.trim()));
    }
  }

  // if single slug, include --peer; if multiple, omit (affects all)
  const peerArg =
    exhaustedSlugs.length === 1 ? ` --peer ${exhaustedSlugs[0]}` : '';

  const lines: string[] = [];
  lines.push(`🦉 where were we?`);
  lines.push('');
  lines.push(`🗿 route.drive`);
  lines.push(`   ├─ where do we go?`);
  lines.push(`   │  ├─ route = ${input.route}`);
  lines.push(`   │  └─ stone = ${input.stone}`);
  lines.push(`   │`);
  lines.push(`   └─ halted, peer reviewer budget exhausted`);
  // display reason without slug suffix (slugs shown in reviews section)
  lines.push(`      ├─ reason: peer reviewer budget exhausted`);
  lines.push(`      │`);

  // add peer reviewer meters section via shared formatter
  const meterLines = formatReviewsMeterLines({
    meters: input.meters,
    baseIndent: '      ',
    sectionIndent: '│  ',
    includeHeader: true,
    headerPrefix: '├─',
  });
  lines.push(...meterLines);
  lines.push(`      │`);

  lines.push(`      ├─ please ask a human to either`);
  lines.push(`      │  ├─ approve as-is`);
  lines.push(`      │  │  └─ ${approveCmd}`);
  lines.push(`      │  │`);
  lines.push(`      │  └─ extend budget (then rerun)`);
  lines.push(
    `      │     └─ rhx route.guard.budget --for review --add N${peerArg} --stone ${input.stone}`,
  );
  lines.push(`      │`);
  lines.push(`      └─ once they approve, run`);
  lines.push(`         └─ ${passCmd}`);

  return lines.join('\n');
};
