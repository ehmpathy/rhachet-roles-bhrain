import { formatReviewBudgetTopupCommand } from '../review/peer/formatReviewBudgetTopupCommand';
import {
  isRouteGuardConcessionExhaustion,
  isRouteGuardUrgentConcessionExhaustion,
} from '../review/peer/genRouteGuardExhaustedReason';

/**
 * .what = one remedy offered by a halt: the label a human reads, and the command that acts on it
 * .why = label and command travel together on every surface, so they are one shape rather than
 *        two parallel lists a caller must keep aligned. `cmd: null` is the prose tail
 *        ("or fix the reviewer, then retry"), which names a remedy that has no one command.
 */
export interface BlockRemedyGroup {
  label: string;
  cmd: string | null;
}

/**
 * .what = detects a terminal reviewer failure (malfunction or constraint)
 * .why = these states should offer overrule guidance, like exhausted offers budget options —
 *        a broken reviewer must not permablock the driver
 */
const isTerminalReviewerFailure = (
  passage: 'allowed' | 'overruled' | 'blocked' | 'malfunction',
  reason: string,
): boolean => {
  if (passage === 'malfunction') return true;
  if (passage === 'blocked' && reason.includes('constraint')) return true;
  return false;
};

/**
 * .what = the word a terminal-failure overrule label names the failure by
 * .why = the label reads `overrule the <noun> — a human must grant`, and the noun is the one
 *        difference between the two terminal kinds. it sat inline as a `const` inside a branch,
 *        which is what forced that branch to be a statement rather than a slot in an array
 *        literal. one named read, so the label is an expression.
 */
const asTerminalFailureNoun = (input: {
  passage: 'allowed' | 'overruled' | 'blocked' | 'malfunction';
}): 'malfunction' | 'constraint' =>
  input.passage === 'malfunction' ? 'malfunction' : 'constraint';

/**
 * .what = the ONE driver-owned remedy a budget-exhaustion halt offers, per its concession grade
 * .why = the budget became a bound, so `increase budget` is the driver's remedy at ONE exhaustion
 *        kind rather than all three. the reason string tells the three apart, and each gets the
 *        lever the driver can actually run.
 *
 * 🔴 .the top-up is offered ONLY where the grade earned it.
 *
 *    a grant needs a live URGENT concession, a reviewer that has run dry, and a `--stone` that
 *    resolved to one stone (`computeBudgetGrantRefusal`). this halt satisfies the second by
 *    construction — it IS the exhaustion — and the reason string already carries the first, in the
 *    two disjoint marks `genRouteGuardExhaustedReason` writes ahead of the colon. so the three
 *    kinds are told apart here, with no route read and no new input.
 *
 * ⚠️ an unconditional label on the other two kinds ADVERTISES A REFUSAL: the driver copies the
 *    command the halt handed it, and the gate rejects it. that is the same pit the concede ack
 *    carried — it sequenced `fix, buy, re-arrive` on a `better` grade — and it is worse here,
 *    because a halt is the surface a driver meets on every re-arrival.
 *
 * 🔴 .the three cases are EARLY RETURNS, never an if/else-if/else chain.
 *    each grade is a terminal answer, so the shape says so and the reader carries no open branch
 *    past the line that settled it (`rule.forbid.else-branches`, raised i001/r006 b1).
 *
 * 🔴 .F022 fork E — a top-up is a deliberate, targeted act, never a blanket sweep.
 *    one exhausted lane → name it with `--peer`, so the write reaches that lane at any level.
 *    several → a bare `--peer`-less `--add N` scopes to the LATEST level alone (the `targetSlugs`
 *    filter in `routeGuardBudget`), which is the set a concession-exhaustion halt computes — every
 *    level terminal, the just-conceded lanes at the top. a lane BELOW the latest level stays
 *    exhausted unless the driver names it (`--peer <slug>` or `--level N`), which is the intended
 *    state rather than a defect the emit should auto-heal.
 */
const asBudgetHaltRemedyGroup = (input: {
  stone: string;
  exhaustedSlugs: string[];
  hasUrgentConcession: boolean;
  hasBetterConcession: boolean;
}): BlockRemedyGroup => {
  // an URGENT concession earned the round, so the top-up is the driver's own lever to spend.
  if (input.hasUrgentConcession)
    return {
      label: `increase budget — yours to spend`,
      cmd: formatReviewBudgetTopupCommand({
        add: 'N',
        peer:
          input.exhaustedSlugs.length === 1 ? input.exhaustedSlugs[0]! : null,
        stone: input.stone,
      }),
    };

  // a BETTER concession earns no round past the meter (F04). the driver named what it would fix
  // and the fix is the whole remedy — the reviewer will not re-read it, and that is the design
  // rather than a loss to route around. so the halt names the fix, and stops.
  if (input.hasBetterConcession)
    return {
      label: `fix what you conceded — yours to run`,
      cmd: `rhx route.stone.set --stone ${input.stone} --as passed`,
    };

  // an ordinary exhaustion conceded naught, so no warrant stands and a grant is refused.
  // ⇒ the driver's one live lever is the answer itself: exhaustion unlocks the LEVEL and never
  //   discharges the DEBT (`rule.always.converge-to-terminal`), so an un-answered given still
  //   holds the stone whatever the meter reads.
  return {
    label: `converge with the reviewer — yours to run`,
    cmd: `rhx route.stone.set --stone ${input.stone} --as absorbed --that ${
      input.exhaustedSlugs.length === 1
        ? input.exhaustedSlugs[0]!
        : '<reviewer>'
    }`,
  };
};

/**
 * .what = the driver's OWN lever at a terminal reviewer failure that exhausted no budget
 * .why = a malfunction is TERMINAL-FOR-UNLOCK, so the level above it pours and the drive goes on
 *        (`define.invariant.review.peer.level-unlock-is-a-latch`). the debt it minted does not go
 *        with it — `asPeerGivenVerdict` scores an undetected count as one blocker — so the driver
 *        owes it a `.taken` exactly as it owes a readable rejection one
 *        (`rule.always.diagnose-reviewer-malfunctions`). that answer is a lever the driver owns.
 *
 * 🔴 .without this slot a malfunction-only halt offers the driver NAUGHT.
 *
 *    `hasBudget` is false, so slot 1 elided and the halt led with
 *    `overrule the <noun> — a human must grant`, then the prose tail. two remedies, both human.
 *    ⇒ a driver that reads it sees a wall and escalates — while the level above has already poured
 *      and sits unconverged.
 *
 *    that is the exact misread `rule.always.spend-own-levers-before-escalation` prices: "a lever
 *    this table omits fares worse than one it lists as human-owned, since a human-owned lever at
 *    least gets surfaced." here the driver's lever was omitted outright.
 *
 * ⚠️ measured, 2026-09-18, this very route at i004. three lanes malfunctioned on one suspended
 *    provider account; two of them (r010, r011) were a level that had just POURED and had read the
 *    diff in full. the driver marked the stone `--as blocked`. the ladder had advanced and the halt
 *    read as a stall, because no line on it said otherwise (`S05`).
 *
 * 🔴 .the label states the LATCH, not merely the command.
 *    `terminal — does not block higher levels` already rides each reviewer line
 *    (`formatGuardReviewerTree`), and it was not enough — it reads as metadata about one lane. the
 *    remedy block is where a driver looks for the MOVE, so the push belongs on the move.
 */
const asTerminalFailureDriverRemedy = (input: {
  stone: string;
}): BlockRemedyGroup => ({
  label: `converge with the reviewer — yours to run, and the levels above stay unlocked`,
  cmd: `rhx route.stone.set --stone ${input.stone} --as absorbed --that <reviewer>`,
});

/**
 * .what = the exhausted reviewer slugs a halt's reason string names, in order
 * .why = the reason carries them as one comma-joined tail after `budget exhausted:`, so a caller
 *        that wants the list must hold a regex, an optional-chain, a split, and a trim. that
 *        pipeline sat inline inside a branch of `computeBlockRemedyGroups`, which forced a
 *        `const` inside the branch and so forced the branch to be a statement
 *        (`rule.forbid.inline-decode-friction`). one named read, so the caller reads as
 *        "the slugs this halt exhausted".
 *
 * .note = an absent tail yields an EMPTY list, never a throw. a halt can name budget exhaustion
 *         with no slug tail (the mark-only form), and `asBudgetHaltRemedyGroup` already treats
 *         zero slugs as "no one lane to name with `--peer`".
 */
const asExhaustedSlugs = (input: { reason: string }): string[] => {
  const matched = input.reason.match(/budget exhausted:\s*(.+)/);
  if (!matched?.[1]) return [];
  return matched[1].split(',').map((slug) => slug.trim());
};

/**
 * .what = the TAIL remedy a halt earns — `approve as-is`, the prose fix-the-reviewer line, or none
 * .why = an exhaustion earns `approve as-is`; an overrule-only halt earns the prose
 *        "or fix the reviewer" instead, because no budget remedy applies to it. the two are
 *        mutually exclusive, so they are one named read with early returns rather than an
 *        if/else-if a caller must unwind (`rule.forbid.else-branches`).
 *
 * 🔴 .a BETTER concession exhaustion earns NEITHER (S12).
 *    the driver declared the round warranted and fixed what it named, so the remedy is theirs — to
 *    print `approve as-is — a human must grant` beside it would summon a human the stance already
 *    made unnecessary. that is the same asymmetry the stance ack renders at `--as conceded`
 *    (case=6 [t1]); it is repeated here because a driver reads the ack once and this halt on every
 *    re-arrival.
 *
 * 🔴 .an URGENT concession KEEPS the tail, and the suppress read must not reach it.
 *    an urgent concession ships nameable harm, so it earns a human's glance BESIDE its round
 *    (`define.invariant.review.peer.budget.urgent-earns-budget`), and `[case2][t0]` pins it.
 *    ⇒ the caller's `suppressApprovalTail` is computed off the DISJOINT `better` predicate, so no
 *      reader of this operation has to learn which half of the severity axis it holds.
 *
 * ⚠️ an overrule still outranks it: a malfunctioned reviewer needs a human whatever the driver
 *    conceded, so the concession only suppresses the APPROVAL tail.
 */
const asTailRemedyGroups = (input: {
  stone: string;
  hasBudget: boolean;
  hasOverrule: boolean;
  suppressApprovalTail: boolean;
}): BlockRemedyGroup[] => {
  if (input.hasBudget && !input.suppressApprovalTail)
    return [
      {
        label: `approve as-is — a human must grant`,
        cmd: `rhx route.stone.set --stone ${input.stone} --as approved`,
      },
    ];
  if (input.hasOverrule)
    return [
      { label: `or fix the reviewer, then retry`, cmd: null },
      // 🔴 the last word a malfunction halt leaves is a PUSH, never a permission.
      //    an overrule is a human's grant and it sat last, so the block closed on an escalation.
      //    the latch says the drive goes on regardless of what the broken level does, and the
      //    driver reads this block rather than the invariant — so the block says it (`S05`).
      {
        label: `a broken level never halts the drive — converge the level above it`,
        cmd: null,
      },
    ];
  return [];
};

/**
 * .what = the ordered remedy groups a halt offers, derived from its passage + reason
 * .why = a stone can be blocked by SEVERAL gates in one pass (a malfunctioned higher level beside
 *        an exhausted lower level); each gate carries a different remedy, so every one must be
 *        offered at once rather than either/or — else a mixed halt hides a remedy and the human
 *        hits a second, unwarned block on re-arrive.
 *
 * 🔴 .why it lives in its own file, exported
 *
 *    it was a PRIVATE helper inside `formatGuardTree`, so the three other surfaces that render the
 *    same remedies each carried their own copy of the labels, the commands, the
 *    `/budget exhausted:\s*(.+)/` regex, and the single-slug `--peer` rule. the comments left
 *    behind said "change one, change all four" — which is a manual-discipline contract, and
 *    exactly what `rule.forbid.duplicate-format-tree-operations` forbids: it asks for ONE shared
 *    format function parameterized by the context differences, so a change lands in one place.
 *
 *    ⚠️ and the discipline had ALREADY failed, which is how the duplication was caught: the four
 *       surfaces did not agree on ORDER. `formatRouteDriveMixedHalt` rendered
 *       budget → overrule → approve; `formatGuardTree` rendered overrule → budget → approve. one
 *       list, two orders, and a comment on each end that promised they matched.
 *
 * 🔴 .the order is BY OWNER, and that resolves the divergence in the rule's favour
 *
 *    `rule.always.spend-own-levers-before-escalation` is explicit — "sort by owner and spend yours
 *    first." `increase budget` is the driver's own lever; `overrule` and `approve` both need a
 *    human. so budget leads, and the two human remedies follow.
 *
 *    ⇒ that is `formatRouteDriveMixedHalt`'s extant order, kept; `formatGuardTree`'s
 *      overrule-first order interleaved the owners (human, driver, human) and is the one that
 *      changed. it moves ONLY in the mixed case — an overrule-only halt still renders
 *      overrule + the prose tail, and a budget-only halt still renders budget + approve, both
 *      byte-identical to before.
 *
 * 🔴 .the driver's lever at slot 1 is now THREE levers, one per halt kind
 *
 *    the budget is a bound rather than a lever anyone may pull, so `increase budget` is no longer
 *    the driver's remedy at every exhaustion — it is the remedy at ONE of them. the reason string
 *    tells the three apart, and each gets the lever the driver can actually run:
 *
 *    | the halt | the driver's lever |
 *    |---|---|
 *    | an URGENT concession | `increase budget` — the grade earned the round |
 *    | a BETTER concession  | `--as passed` — fix what you conceded; no round is owed |
 *    | no concession        | `--as absorbed` — converge; the debt outlives the meter |
 *
 *    ⇒ the SLOT is unchanged, so the order stays by owner and the mixed halt still leads with
 *      the driver's own. what changed is which command sits in it.
 */
export const computeBlockRemedyGroups = (input: {
  stone: string;
  passage: 'allowed' | 'overruled' | 'blocked' | 'malfunction';
  reason: string;
}): BlockRemedyGroup[] => {
  const hasBudget = input.reason.includes('budget exhausted');
  const hasOverrule = isTerminalReviewerFailure(input.passage, input.reason);
  // 🔴 the two reads are DISJOINT, and the names must say so.
  //    `isRouteGuardConcessionExhaustion` matches the `better` mark ONLY — its own docblock
  //    states it ("the two marks are disjoint by construction"). while it stood alone here,
  //    `hasConcession` read unambiguously; beside an urgent peer it reads as the union, and it
  //    is not one. ⇒ the name carries the severity, so no reader of a downstream branch has to
  //    open the predicate to learn which half it holds (`rule.forbid.domain-term-ambiguity`).
  const hasBetterConcession = isRouteGuardConcessionExhaustion({
    reason: input.reason,
  });
  const hasUrgentConcession = isRouteGuardUrgentConcessionExhaustion({
    reason: input.reason,
  });
  if (!hasBudget && !hasOverrule) return [];

  // ⚠️ an overrule outranks a BETTER concession: a malfunctioned reviewer needs a human whatever
  //    the driver conceded, so the concession only suppresses the APPROVAL tail.
  const suppressApprovalTail = hasBudget && hasBetterConcession && !hasOverrule;

  // 🔴 the result is built by SPREAD, never by `.push` into a mutable accumulator.
  //    the three slots are independent reads of the same inputs, so the array literal states the
  //    order on the page and each slot is a fresh structure rather than a mutation of a shared one
  //    (`rule.require.immutable-vars`, raised i002/r006 n3). the mutable form also forced the
  //    inline regex decode below into a statement branch, which is why both moved together.
  return [
    // 1 — the driver's OWN lever, first.
    //
    // 🔴 the owner suffix is not decoration. the remedies render as peer branches at one depth, so
    //    with bare labels they read as several remedies of one kind — and only some are.
    //    `rule.always.spend-own-levers-before-escalation` names this trap outright: "the guard
    //    renders increase budget and approve as-is as two peer branches, which invites the read
    //    'two human remedies'." a driver who reads it that way stalls on a foreman while a lever
    //    they own sits one line above (raised by r5 · r7 · r8 at i012; first at i011 r005).
    //
    // WHICH driver lever this halt earns is `asBudgetHaltRemedyGroup`'s call; its docblock carries
    // the grade rules and the F022 scope rule. this slot only states that the driver's own goes
    // first.
    //
    // 🔴 the slot is UNCONDITIONAL now, and that is the change.
    //    it used to elide when no budget was exhausted, so a malfunction-only halt opened on a
    //    human lever. we returned `[]` above unless one of the two gates fired, so the `else` here
    //    is a terminal reviewer failure by construction — and it has a driver lever of its own.
    ...(hasBudget
      ? [
          asBudgetHaltRemedyGroup({
            stone: input.stone,
            exhaustedSlugs: asExhaustedSlugs({ reason: input.reason }),
            hasUrgentConcession,
            hasBetterConcession,
          }),
        ]
      : [asTerminalFailureDriverRemedy({ stone: input.stone })]),

    // 2 — the human's levers, after.
    //
    // ⚠️ the owner suffix rides on the overrule label too, for the reason above:
    //    `spend-own-levers-before-escalation` lists `--as overruled` in its human column, beside
    //    `--as approved`. a bare `overrule the malfunction` sits at one depth with
    //    `increase budget — yours to spend` and reads as a third lever the driver owns. it is not.
    ...(hasOverrule
      ? [
          {
            label: `overrule the ${asTerminalFailureNoun({
              passage: input.passage,
            })} — a human must grant`,
            cmd: `rhx route.stone.set --stone ${input.stone} --as overruled`,
          },
        ]
      : []),

    // 3 — the tail. `asTailRemedyGroups` carries which of the two it is, and when it is neither.
    ...asTailRemedyGroups({
      stone: input.stone,
      hasBudget,
      hasOverrule,
      suppressApprovalTail,
    }),
  ];
};

/**
 * .what = renders remedy groups as box-draw tree lines beneath a caller's own branch
 * .why = the four surfaces that offer remedies differ ONLY in how deep they sit and whether they
 *        breathe between groups. that is the "parameters for context differences" clause of
 *        `rule.forbid.duplicate-format-tree-operations` — the shape itself is one truth here, so a
 *        connector or glyph change lands once rather than four times.
 *
 * .note = `baseIndent` is the full prefix each group's connector hangs off, so a caller passes
 *         whatever its own tree has already drawn (`'   '`, `'      '`, `'   │  '`, …). the
 *         command line indents under its label by the standard continuation: `'│  '` while
 *         siblings follow, `'   '` on the last.
 *
 * .note = `spacers` inserts a bare `│` between groups. the two route.drive halt surfaces breathe
 *         that way and the two guard surfaces do not — a deliberate density difference, since the
 *         drive surfaces render remedies as the final block a human reads.
 */
export const formatBlockRemedyGroups = (input: {
  groups: BlockRemedyGroup[];
  baseIndent: string;
  spacers?: boolean;
}): string[] => {
  const lines: string[] = [];
  input.groups.forEach((group, index) => {
    const isLast = index === input.groups.length - 1;
    lines.push(`${input.baseIndent}${isLast ? '└─' : '├─'} ${group.label}`);
    if (group.cmd !== null)
      lines.push(`${input.baseIndent}${isLast ? '   ' : '│  '}└─ ${group.cmd}`);
    if (input.spacers && !isLast) lines.push(`${input.baseIndent}│`);
  });
  return lines;
};
