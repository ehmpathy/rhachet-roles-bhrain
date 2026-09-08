import {
  computeBlockRemedyGroups,
  formatBlockRemedyGroups,
} from '../guard/tree/formatBlockRemedyGroups';
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
  // 🔴 every label, command, and the `budget exhausted:` parse come from ONE shared operation.
  //    this file used to derive its own — its own copy of the regex, the single-slug `--peer`
  //    rule, and all three labels — under a docblock that promised they stayed "byte-identical
  //    to formatGuardTree's … change one, change both". that promise had ALREADY broken on
  //    ORDER (this surface rendered budget → overrule → approve, formatGuardTree rendered
  //    overrule → budget → approve), which is exactly why
  //    `rule.forbid.duplicate-format-tree-operations` asks for a shared function rather than a
  //    comment (r1 blocker.1, i016). the owner-sort this file already had is the one that won.
  //
  // ⚠️ `passage` is 'malfunction' when the reason names one, so the shared builder derives the
  //    same overrule noun this file derived by hand — malfunction outranks constraint.
  const remedyGroups = computeBlockRemedyGroups({
    stone: input.stone,
    passage: input.reason.includes('malfunction') ? 'malfunction' : 'blocked',
    reason: input.reason,
  });

  const lines: string[] = [];
  lines.push(`🦉 where were we?`);
  lines.push('');
  lines.push(`🗿 route.drive`);
  lines.push(`   ├─ where do we go?`);
  lines.push(`   │  ├─ route = ${asRouteDisplayPath({ route: input.route })}`);
  lines.push(`   │  └─ stone = ${input.stone}`);
  lines.push(`   │`);
  lines.push(`   └─ halted, ${input.reason}`);
  // ⛔ no spacer under the `halted,` header. every OTHER halt renderer in the repo flushes
  //    its header straight to its first child — `formatRouteDriveBudgetExhausted:88-90`
  //    (`halted, …` → `├─ reason: …`) and `getRouteDriveBlockerMessage:143-144`
  //    (`halted, …` → `├─ please ask a human to`). this surface alone pushed a `│` there,
  //    so a driver who met a mixed halt read a tree shaped unlike every halt they had seen
  //    before, on the one occasion two gates fired at once
  //    (r6 ergo-snapshot-visual-blemishes, nitpick.1, i018).

  // peer reviewer meters section via the shared formatter
  const meterLines = formatReviewsMeterLines({
    meters: input.meters,
    baseIndent: '      ',
    sectionIndent: '│  ',
    includeHeader: true,
    headerPrefix: '├─',
  });
  lines.push(...meterLines);
  // ⚠️ this spacer belongs to the reviews section, and parts it from the remedy block below
  //    — see the twin note in `formatRouteDriveBudgetExhausted`. an empty meter set drops
  //    the section entirely, so an unconditional push here would strand a bare connector
  //    between the `halted,` header and its only child.
  if (meterLines.length > 0) lines.push(`      │`);

  // every remedy, one per concurrent gate, sorted BY OWNER — the driver's own lever
  // first, the human's after.
  //
  // 🔴 this surface carried the sharper form of the defect its peers carried. it listed
  //    `increase budget` beneath `please ask a human to either` — so it did not merely
  //    invite the read that budget is a human remedy, it ASSERTED it. a driver who obeyed
  //    the line would stall on a foreman for a command they can run themselves, which is
  //    the precise failure `rule.always.spend-own-levers-before-escalation` exists to
  //    prevent: "sort by owner and spend yours first."
  lines.push(`      └─ spend your own lever first, then ask a human`);
  lines.push(
    ...formatBlockRemedyGroups({
      groups: remedyGroups,
      baseIndent: '         ',
      spacers: true,
    }),
  );

  return lines.join('\n');
};
