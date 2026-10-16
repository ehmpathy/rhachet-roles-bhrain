import { ABSORPTION_CONCEDE_SEQUENCE } from '../review/peer/absorptionConcedeSequence';
import { asRouteStoneStanceCommand } from '../review/peer/asRouteStoneStanceCommand';
import { computeTotalUndeclaredConcerns } from '../review/peer/computeTotalUndeclaredConcerns';
import type { RouteGuardReviewPeerUndeclared } from '../review/peer/computeUndeclaredConcerns';
import { asBranchBodyLines } from './asBranchBodyLines';
import { asReviewPeerLaneHeadLines } from './asReviewPeerLaneHeadLines';

/**
 * .what = the "declare a stance on each concern" halt
 * .why = acceptance #1 — a driver declares exactly one stance per concern, and an absent
 *        stance is refused rather than defaulted. this is the surface that teaches the
 *        two words, so a driver meets them here rather than in a rule they never read
 *        (rule.require.discoverability).
 *
 * 🔴 CONCEDE LEADS, and that order is the design (S11). a concede is the default answer to
 *    a critique — fix it, then re-arrive — and a dispute is an escalation that spends a
 *    human's attention at the close. to print the dispute first would teach the escalation
 *    as the norm, whatever the prose beneath it says.
 *
 * 🔴 it names NEITHER a budget top-up NOR a human approval. the stance precedes the budget:
 *    a top-up bought before the stance buys rounds to re-argue rather than to settle, and a
 *    human summoned before the driver's own levers is the escalation `case=2` [t0] forbids.
 *
 * .note = modelled on formatRouteGuardReviewPeerFeedbackAbsorbPrompt, whose indent discipline
 *         and `why` / `what to do` head grammar this inherits. it is NOT built on
 *         computeBlockRemedyGroups — that operation early-returns [] for every halt class
 *         but two, and a stance halt is neither, so it would render an empty block.
 * .note = its lane head and its branch bodies render through `asReviewPeerLaneHeadLines` and
 *         `asBranchBodyLines`, the same two the reply halt reads, so the two prompts cannot
 *         drift apart (rule.forbid.duplicate-format-tree-operations)
 */
export const formatRouteGuardReviewPeerAbsorptionPrompt = (input: {
  stone: string;
  lanes: RouteGuardReviewPeerUndeclared[];
}): string => {
  // .note = deliberate local line-builder, scoped to this formatter — the escape hatch in
  //         rule.require.immutable-vars permits a scoped emit builder
  const lines: string[] = [];
  const total = input.lanes.length;
  const concernsTotal = computeTotalUndeclaredConcerns({ lanes: input.lanes });

  // the two taught stance commands, from the one composer that owns their flag grammar
  const concede = asRouteStoneStanceCommand({
    stone: input.stone,
    as: 'conceded',
    with: '<slug>',
    about: '<concern>',
  });
  const dispute = asRouteStoneStanceCommand({
    stone: input.stone,
    as: 'disputed',
    with: '<slug>',
    about: '<concern>',
    why: '.fulcrums/inventory.of=fulcrums.case=F00N-<slug>.md',
  });

  lines.push(`🦉 each concern awaits your absorption`);
  lines.push(``);
  lines.push(`🌕 lets declare`);
  lines.push(`   │`);

  input.lanes.forEach((lane, i) => {
    lines.push(
      ...asReviewPeerLaneHeadLines({ index: i + 1, total, slug: lane.slug }),
    );
    if (lane.unreadable)
      lines.push(`   │  ├─ verdict = unreadable (counted as 1 blocker)`);
    lines.push(`   │  └─ undeclared`);
    lane.concerns.forEach((concern, c) => {
      const last = c === lane.concerns.length - 1;
      lines.push(`   │     ${last ? '└─' : '├─'} ${concern}`);
    });
    lines.push(`   │`);
  });

  // the why — one branch, so its head stays bare
  lines.push(`   ├─ why`);
  lines.push(
    ...asBranchBodyLines({
      indent: `   │  `,
      body: [
        `a budget ends a disagreement when it runs out, not by a verdict on`,
        `who is right. a stance is that verdict: you own each concern — fix`,
        `it, or hold that it is fine to continue — and it goes on record`,
        `where a council can rule on it.`,
      ],
    }),
  );
  lines.push(`   │`);

  // 🔴 concede first, and one line — the default is the cheap one to read
  lines.push(`   ├─ what to do — concede, by default`);
  lines.push(
    ...asBranchBodyLines({
      indent: `   │  `,
      body: [
        `the reviewer is right and you will fix it. that is the ordinary`,
        `answer, and the sequence is: ${ABSORPTION_CONCEDE_SEQUENCE}.`,
        ``,
        // --severity is MANDATORY on a concede (setStoneAsConcernAbsorbed refuses without it), so the
        // taught command carries it. this is the most-read command in the flow — concede is the
        // default — and a taught command that is refused at the boundary is the friction hazard
        // `rule.forbid.friction-hazards` names (r9 b1)
        `${concede.head} \\`,
        `  ${concede.stance} \\`,
        `  ${concede.tail}`,
      ],
    }),
  );
  lines.push(`   │`);

  // the dispute second, and it costs more to read because it costs more to take
  lines.push(`   └─ what to do — dispute, to escalate`);
  lines.push(
    ...asBranchBodyLines({
      indent: `      `,
      body: [
        `this ONE concern is fine to continue, and you want a human council`,
        `to rule on it at the close. it costs a fulcrum entry you author and`,
        `a human's attention, so reach for it where the concern is severe or`,
        `recurs — never as the default.`,
        ``,
        `${dispute.head} \\`,
        `  ${dispute.stance} \\`,
        `  ${dispute.tail}`,
        ``,
        `${concernsTotal} concern${concernsTotal === 1 ? '' : 's'} stand${concernsTotal === 1 ? 's' : ''} undeclared — one command each.`,
      ],
    }),
  );

  return lines.join('\n');
};
