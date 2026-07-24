import { getReviewPeerLadderStatus } from '../guard/review/peer/meter/getReviewPeerLadderStatus';
import { formatGuardReviewLadderFooter } from '../guard/tree/formatGuardReviewLadderFooter';
import {
  formatReviewsMeterLines,
  type GuardPeerMeterStatus,
} from '../guard/tree/formatGuardTree';
import { asRouteDisplayPath } from './asRouteDisplayPath';

/**
 * .what = formats route.drive output when peer reviewer budget exhausted
 * .why = allows agent to stop gracefully when blocked on budget exhaustion.
 *        shared by getRouteDriveBlockerMessage (the legacy blocker path) and
 *        getRouteDriveExhaustedMessage (the exhausted-status path) — one truth,
 *        two call sites (rule.prefer.wet-over-dry).
 */
export const formatRouteDriveBudgetExhausted = (input: {
  route: string;
  stone: string;
  reason: string | null;
  meters: GuardPeerMeterStatus[];
}): string => {
  const approveCmd = `rhx route.stone.set --stone ${input.stone} --as approved`;
  const passCmd = `rhx route.stone.set --stone ${input.stone} --as passed`;

  // upward unlock — a lower level is exhausted (terminal) but a HIGHER level is live again
  // (status.unlockTransition). this is NOT a spent ladder: the "halted, budget exhausted /
  // ask a human" text would be a FALSE HALT (the vision's forbidden state) and would
  // contradict the footer's "a human is only needed once every level is terminal" — two
  // opposite reads in one stdout. so here render ONLY the reviews section + the "path
  // continues" footer, which names the live level and the --as arrived re-drive. no human
  // is needed yet (rule.require.single-source-of-truth-for-render).
  const status = getReviewPeerLadderStatus({ peerMeters: input.meters });
  if (status.unlockTransition) {
    const unlockHeader = [
      `🦉 where were we?`,
      '',
      `🗿 route.drive`,
      `   ├─ where do we go?`,
      `   │  ├─ route = ${asRouteDisplayPath({ route: input.route })}`,
      `   │  └─ stone = ${input.stone}`,
      `   │`,
    ];
    const unlockMeterLines = formatReviewsMeterLines({
      meters: input.meters,
      baseIndent: '   ',
      sectionIndent: '  ',
      includeHeader: true,
      headerPrefix: '└─',
    });
    const ladderFooter = formatGuardReviewLadderFooter({
      stone: input.stone,
      status,
    });
    return [...unlockHeader, ...unlockMeterLines, '', ...ladderFooter].join(
      '\n',
    );
  }

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
  lines.push(`   │  ├─ route = ${asRouteDisplayPath({ route: input.route })}`);
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
