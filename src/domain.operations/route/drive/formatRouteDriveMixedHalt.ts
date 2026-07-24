import {
  formatReviewsMeterLines,
  type GuardPeerMeterStatus,
} from '../guard/tree/formatGuardTree';
import { asRouteDisplayPath } from './asRouteDisplayPath';

/**
 * .what = formats the route.drive replay of a MIXED halt — a malfunction (or constraint)
 *         that broke in the SAME pass a lower level exhausted, so every reason + every
 *         remedy must show at once
 * .why = a mixed halt persists status='malfunction' with a combined reason
 *        ("reviewer or judge malfunctioned; peer reviewer budget exhausted: <slugs>"). the
 *        onBoot/onStop replay must NOT collapse it to the bare "guard malfunction, tell a
 *        human" escalation — that drops the also-present exhaustion + its overrule/budget
 *        remedies, which sends the human down a path that hits a SECOND, unwarned block. this
 *        renders the full halt so the replay names every reason and offers every remedy,
 *        with the SAME labels the live guard tree emits (overrule / increase budget /
 *        approve as-is), so a driver reads the two surfaces as one story
 *        (rule.require.single-source-of-truth-for-render).
 */
export const formatRouteDriveMixedHalt = (input: {
  route: string;
  stone: string;
  reason: string;
  meters: GuardPeerMeterStatus[];
}): string => {
  const overruleCmd = `rhx route.stone.set --stone ${input.stone} --as overruled`;
  const approveCmd = `rhx route.stone.set --stone ${input.stone} --as approved`;

  // extract the exhausted reviewer slugs from the combined reason (exhaustion is last)
  const exhaustedMatch = input.reason.match(/budget exhausted:\s*(.+)/);
  const exhaustedSlugs = exhaustedMatch?.[1]
    ? exhaustedMatch[1].split(',').map((s) => s.trim())
    : [];
  const peerArg =
    exhaustedSlugs.length === 1 ? ` --peer ${exhaustedSlugs[0]}` : '';
  const budgetCmd = `rhx route.guard.budget --for review --add N${peerArg} --stone ${input.stone}`;

  // malfunction outranks constraint for the overrule noun
  const overruleNoun = input.reason.includes('malfunction')
    ? 'malfunction'
    : 'constraint';

  const lines: string[] = [];
  lines.push(`🦉 where were we?`);
  lines.push('');
  lines.push(`🗿 route.drive`);
  lines.push(`   ├─ where do we go?`);
  lines.push(`   │  ├─ route = ${asRouteDisplayPath({ route: input.route })}`);
  lines.push(`   │  └─ stone = ${input.stone}`);
  lines.push(`   │`);
  lines.push(`   └─ halted, ${input.reason}`);
  lines.push(`      │`);

  // peer reviewer meters section via the shared formatter
  const meterLines = formatReviewsMeterLines({
    meters: input.meters,
    baseIndent: '      ',
    sectionIndent: '│  ',
    includeHeader: true,
    headerPrefix: '├─',
  });
  lines.push(...meterLines);
  lines.push(`      │`);

  // every remedy, one per concurrent gate, in precedence order
  lines.push(`      └─ please ask a human to either`);
  lines.push(`         ├─ overrule the ${overruleNoun}`);
  lines.push(`         │  └─ ${overruleCmd}`);
  lines.push(`         │`);
  lines.push(`         ├─ increase budget (then rerun)`);
  lines.push(`         │  └─ ${budgetCmd}`);
  lines.push(`         │`);
  lines.push(`         └─ approve as-is`);
  lines.push(`            └─ ${approveCmd}`);

  return lines.join('\n');
};
