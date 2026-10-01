import {
  computeBlockRemedyGroups,
  formatBlockRemedyGroups,
} from '../guard/tree/formatBlockRemedyGroups';
import {
  formatReviewsMeterLines,
  type GuardPeerMeterStatus,
} from '../guard/tree/formatGuardTree';
import { formatRouteDriveHeader } from './formatRouteDriveHeader';

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
  brain: string | null;
  effort: string | null;
  reason: string;
  meters: GuardPeerMeterStatus[];
}): string => {
  // 🔴 every label, command, and the `budget exhausted:` parse come from ONE shared
  //    operation, per `rule.forbid.duplicate-format-tree-operations` — a hand-kept copy
  //    would drift from formatGuardTree's own label text or sort order. this surface
  //    renders budget → overrule → approve, the sort order it keeps.
  //
  // 🟡 `passage` is 'malfunction' when the reason names one, so the shared builder derives the
  //    same overrule noun this file derived by hand — malfunction outranks constraint.
  const remedyGroups = computeBlockRemedyGroups({
    stone: input.stone,
    passage: input.reason.includes('malfunction') ? 'malfunction' : 'blocked',
    reason: input.reason,
  });

  const lines: string[] = [...formatRouteDriveHeader(input)];
  lines.push(`   └─ halted, ${input.reason}`);
  // ⛔ no spacer under the `halted,` header. every other halt renderer in the repo flushes
  //    its header straight to its first child — `formatRouteDriveBudgetExhausted`
  //    (`halted, …` → `├─ reason: …`) and `getRouteDriveBlockerMessage`
  //    (`halted, …` → `├─ please ask a human to`). match that shape here too.

  // peer reviewer meters section via the shared formatter
  const meterLines = formatReviewsMeterLines({
    meters: input.meters,
    baseIndent: '      ',
    sectionIndent: '│  ',
    includeHeader: true,
    headerPrefix: '├─',
  });
  lines.push(...meterLines);
  // 🟡 this spacer belongs to the reviews section, and parts it from the remedy block below
  //    — see the twin note in `formatRouteDriveBudgetExhausted`. an empty meter set drops
  //    the section entirely, so an unconditional push here would strand a bare connector
  //    between the `halted,` header and its only child.
  if (meterLines.length > 0) lines.push(`      │`);

  // every remedy, one per concurrent gate, sorted BY OWNER — the driver's own lever
  // first, the human's after.
  //
  // 🔴 sort by owner — the driver's own lever first, the human's after. `increase budget`
  //    listed beneath "please ask a human to either" reads as a human remedy, and a driver
  //    who obeys stalls on a foreman for a command they can run themselves, which is
  //    exactly what `rule.always.spend-own-levers-before-escalation` forbids: "sort by
  //    owner and spend yours first."
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
