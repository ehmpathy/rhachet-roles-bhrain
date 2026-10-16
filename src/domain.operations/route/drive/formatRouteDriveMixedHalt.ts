import { asGuardReasonHead } from '../guard/asGuardReasonHead';
import { formatGuardMalfunctionClearLines } from '../guard/formatGuardMalfunctionClearLines';
import {
  computeBlockRemedyGroups,
  formatBlockRemedyGroups,
} from '../guard/tree/formatBlockRemedyGroups';
import type { GuardPeerMeterStatus } from '../guard/tree/formatGuardTree';
import { formatRouteDriveHaltLeverLead } from './formatRouteDriveHaltLeverLead';
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
  const remedyPassage = input.reason.includes('malfunction')
    ? 'malfunction'
    : 'blocked';
  const remedyGroups = computeBlockRemedyGroups({
    stone: input.stone,
    passage: remedyPassage,
    reason: input.reason,
    // the route.drive replay reads the persisted reason only, never a .given
    lever: null,
  });

  // .note = deliberate local line-builder, scoped to this formatter — the escape hatch in
  //         rule.require.immutable-vars permits a scoped emit builder; no array crosses a boundary.
  const lines: string[] = [...formatRouteDriveHeader(input)];
  // the header line shows the reason's head; the clear block below names each broken part
  lines.push(
    `   └─ halted, ${asGuardReasonHead({ passage: remedyPassage, reason: input.reason }) ?? input.reason}`,
  );
  // ⛔ no spacer under the `halted,` header. every OTHER halt renderer in the repo flushes
  //    its header straight to its first child — `formatRouteDriveBudgetExhausted:88-90`
  //    (`halted, …` → `├─ reason: …`) and `getOneRouteDriveBlockerMessage:143-144`
  //    (`halted, …` → `├─ please ask a human to`). this surface alone pushed a `│` there,
  //    so a driver who met a mixed halt read a tree shaped unlike every halt they had seen
  //    before, on the one occasion two gates fired at once
  //    (r6 ergo-snapshot-visual-blemishes, nitpick.1, i018).

  // 🔴 a malfunction stays the DRIVER's to clear, so its own levers lead the halt — the same
  //    lever list the pure malfunction replay and the guard tree render
  //    (rule.always.diagnose-reviewer-malfunctions, rule.forbid.duplicate-format-tree-operations).
  //    a mixed halt once showed only budget / overrule / approve, so a driver whose higher level
  //    broke in the same pass a lower level spent was taught the human remedies and never that
  //    the broken lane was theirs to diagnose (r014 nitpick.3, i014). a constraint needs no
  //    such block: its own levers (partition, narrow) already ride in the remedy groups.
  //
  //    the block itself (lead, rows, indent) renders from the one clear-block builder the guard
  //    tree and the stone.set emit read; it names each broken part off the persisted reason
  if (remedyPassage === 'malfunction')
    lines.push(
      ...formatGuardMalfunctionClearLines({
        stone: input.stone,
        reason: input.reason,
        indent: '      ',
        branch: '├─',
      }),
      `      │`,
    );

  // the reviews section, its spacer, and the lever head come from the one builder the budget
  // halt reads too (r003 nitpick.1, i014)
  //
  // every remedy, one per concurrent gate, sorted BY OWNER — the driver's own lever
  // first, the human's after.
  //
  // 🔴 sort by owner — the driver's own lever first, the human's after. `increase budget`
  //    listed beneath "please ask a human to either" reads as a human remedy, and a driver
  //    who obeys stalls on a foreman for a command they can run themselves, which is
  //    exactly what `rule.always.spend-own-levers-before-escalation` forbids: "sort by
  //    owner and spend yours first."
  lines.push(
    ...formatRouteDriveHaltLeverLead({
      meters: input.meters,
      leverHead: 'human',
      leverBranch: '└─',
    }),
  );
  lines.push(
    ...formatBlockRemedyGroups({
      groups: remedyGroups,
      baseIndent: '         ',
      spacers: true,
    }),
  );

  return lines.join('\n');
};
