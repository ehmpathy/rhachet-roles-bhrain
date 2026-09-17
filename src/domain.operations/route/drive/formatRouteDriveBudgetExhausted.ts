import { asConcessionReasonDisplay } from '../guard/review/peer/asConcessionReasonDisplay';
import { isRouteGuardConcessionExhaustion } from '../guard/review/peer/genRouteGuardExhaustedReason';
import { getReviewPeerLadderStatus } from '../guard/review/peer/meter/getReviewPeerLadderStatus';
import {
  computeBlockRemedyGroups,
  formatBlockRemedyGroups,
} from '../guard/tree/formatBlockRemedyGroups';
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
  // ⚠️ the `--as approved` command is NOT built here. it lives solely inside
  //    `formatBlockRemedyGroups`, the shared builder this file delegates its remedies to. a local
  //    copy survived the consolidation unused, which re-opened the two-homes drift hazard
  //    `rule.require.single-source-of-truth-for-render` exists to close (r001 nitpick.1, i025).
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

  // 🔴 the remedies come from ONE shared operation — labels, commands, the
  //    `budget exhausted:` parse and the single-slug `--peer` rule alike. this file used to
  //    carry its own copy of each under a comment that read "change one, change all four",
  //    which is manual discipline where `rule.forbid.duplicate-format-tree-operations` asks
  //    for a shared function (r1 blocker.1, i016).
  //
  // ⚠️ the reason FALLS BACK to the bare halt text, because this surface is by definition the
  //    budget-exhausted halt and its caller may pass `reason: null`. the shared builder keys
  //    off `includes('budget exhausted')`, so the fallback keeps the remedies on the page; with
  //    no `: <slugs>` suffix the parse yields none and `--peer` is omitted, which is exactly
  //    what the hand-rolled code did with a null reason.
  const remedyGroups = computeBlockRemedyGroups({
    stone: input.stone,
    passage: 'blocked',
    reason: input.reason ?? 'peer reviewer budget exhausted',
  });

  // 🔴 a CONCESSION exhaustion is a different halt, and it says so in its first line (S12).
  //    every skipped lane carries a live concession, so the budget is not spent on a
  //    disagreement — it is owed to the round that CONFIRMS fixes the driver already
  //    agreed to make. the wisher's own words: "halted on more budget, to address
  //    concessions".
  //
  // ⚠️ it changes the WORDS and the TAIL only; the meters, the remedies, and the tree
  //    shape are the same operation. two renders would drift
  //    (rule.forbid.duplicate-format-tree-operations).
  const isConcession = isRouteGuardConcessionExhaustion({
    reason: input.reason,
  });

  // 🔴 an URGENT concession is a THIRD halt (F028/S14). the driver conceded, but ≥1
  //    concession ships nameable harm — security · safety · monetary · reputation ·
  //    behavioral — so the maintenance floor is not enough: it earns a human's glance and
  //    a round. so it renders as the human wait (unlike a `better` concession, which is
  //    the driver's own), PLUS a warn line that tells the human why the round is owed
  //    (`define.invariant.review.peer.budget.urgent-earns-budget`).
  // 🔴 the REASON LINE and the WARN come from the ONE shared decoder, never from a second
  //    inline decode. this file used to re-derive them and keyed its reason on `isConcession`
  //    (better-only), so an URGENT halt printed `reason: peer reviewer budget exhausted` here
  //    while `formatRouteStoneEmit` — routed through the decoder — printed the concession words
  //    for the SAME persisted reason. two surfaces a driver meets consecutively, one halt, two
  //    contradictory statements (r1 b2; rule.require.single-source-of-truth-for-render).
  //
  // ⚠️ the DISPOSITION branches below still key on `isConcession` (better-only), and that is
  //    the design: a better concession is the driver's own push, an urgent one is a human wait.
  //    what the decoder settles is the WORDS, never the layout.
  const display = asConcessionReasonDisplay({ reason: input.reason });

  const lines: string[] = [];
  lines.push(`🦉 where were we?`);
  lines.push('');
  lines.push(`🗿 route.drive`);
  lines.push(`   ├─ where do we go?`);
  lines.push(`   │  ├─ route = ${asRouteDisplayPath({ route: input.route })}`);
  lines.push(`   │  └─ stone = ${input.stone}`);
  lines.push(`   │`);
  lines.push(
    isConcession
      ? `   └─ halted on more budget, to address concessions`
      : `   └─ halted, peer reviewer budget exhausted`,
  );
  // the reason line comes from the shared decoder, which sheds the parseable marker for
  // EITHER severity. a non-concession halt keeps the bare text — the raw reason may carry a
  // `: <slugs>` suffix, and the slugs are already in the reviews section below
  lines.push(
    display.isConcession
      ? `      ├─ reason: ${display.reasonText}`
      : `      ├─ reason: peer reviewer budget exhausted`,
  );
  // ⚠️ the urgent warn rides on the ordinary human-wait render, never the `better` one —
  //    an urgent concession sheds none of the human's part; it adds a reason for it.
  // 🔴 nested under `reason`, never a peer of it — the warn explains WHY that reason line
  //    is a human wait rather than a driver's own push, so it is a child of the reason, not
  //    a second top-level fact.
  if (display.warnText) lines.push(`      │  └─ 🟡 ${display.warnText}`);
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
  // ⚠️ the spacer belongs to the reviews section, so it goes when the section goes.
  //    `formatReviewsMeterLines` returns [] on an empty meter set, and an unconditional
  //    push here would leave the `│` it emitted above it — two blank connectors in a row,
  //    which is the blemish this repairs rather than a second one (r7 nitpick.1, i016).
  if (meterLines.length > 0) lines.push(`      │`);

  // every remedy, sorted BY OWNER — the driver's own lever first, the human's after.
  //
  // 🔴 this is the plainest budget halt, so it is the surface a driver meets this defect
  //    on most often — and it carried the defect in its sharpest form. it listed the
  //    budget top-up BENEATH `please ask a human to either`, so it did not merely invite
  //    the read that budget is a human remedy, it asserted it. a driver who obeyed the
  //    line would stall on a foreman for a command they can run themselves, which is
  //    exactly what `rule.always.spend-own-levers-before-escalation` exists to prevent:
  //    "sort by owner and spend yours first."
  //
  // ⚠️ it also called the lever `extend budget` where every peer surface calls it
  //    `increase budget` — one concept under two words, which
  //    `rule.forbid.domain-term-inconsistency` forbids. the labels are byte-identical to
  //    formatGuardTree / formatRouteStoneEmit / formatRouteDriveMixedHalt because all four
  //    now render from one shared operation, so a driver reads them as one story
  //    (rule.require.single-source-of-truth-for-render).
  // 🔴 a concession halt names no human at all, so the "then ask a human" half of this
  //    header would be false — there is nobody to ask and no second remedy to sort.
  lines.push(
    isConcession
      ? `      ├─ what to do — yours to run, no human needed`
      : `      ├─ spend your own lever first, then ask a human`,
  );
  lines.push(
    ...formatBlockRemedyGroups({
      groups: remedyGroups,
      baseIndent: '      │  ',
      spacers: true,
    }),
  );
  lines.push(`      │`);
  // 🔴 `once they approve` presumed the human branch for BOTH remedies, so a driver who
  //    topped up their own budget was told to wait on an approval that was never owed.
  //    the passage command follows a grant, never a top-up — a top-up is followed by a
  //    re-arrival, which the guard prints on its own.
  lines.push(
    isConcession
      ? `      └─ then re-arrive`
      : `      └─ once a human grants the approval, run`,
  );
  lines.push(`         └─ ${passCmd}`);

  return lines.join('\n');
};
