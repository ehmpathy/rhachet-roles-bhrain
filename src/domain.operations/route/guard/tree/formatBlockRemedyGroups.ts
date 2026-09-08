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
 */
export const computeBlockRemedyGroups = (input: {
  stone: string;
  passage: 'allowed' | 'overruled' | 'blocked' | 'malfunction';
  reason: string;
}): BlockRemedyGroup[] => {
  const hasBudget = input.reason.includes('budget exhausted');
  const hasOverrule = isTerminalReviewerFailure(input.passage, input.reason);
  if (!hasBudget && !hasOverrule) return [];

  const groups: BlockRemedyGroup[] = [];

  // 1 — the driver's OWN lever, first.
  //
  // 🔴 the owner suffix is not decoration. the remedies render as peer branches at one depth, so
  //    with bare labels they read as several remedies of one kind — and only some are.
  //    `rule.always.spend-own-levers-before-escalation` names this trap outright: "the guard
  //    renders increase budget and approve as-is as two peer branches, which invites the read
  //    'two human remedies'." a driver who reads it that way stalls on a foreman while a lever
  //    they own sits one line above (raised by r5 · r7 · r8 at i012; first at i011 r005).
  if (hasBudget) {
    const exhaustedMatch = input.reason.match(/budget exhausted:\s*(.+)/);
    const exhaustedSlugs = exhaustedMatch?.[1]
      ? exhaustedMatch[1].split(',').map((s) => s.trim())
      : [];
    // one slug → name it with --peer; several → omit, since the top-up affects them all
    const peerArg =
      exhaustedSlugs.length === 1 ? ` --peer ${exhaustedSlugs[0]}` : '';
    groups.push({
      label: `increase budget — yours to spend`,
      cmd: `rhx route.guard.budget --for review --add N${peerArg} --stone ${input.stone}`,
    });
  }

  // 2 — the human's levers, after.
  //
  // ⚠️ the owner suffix rides on the overrule label too, for the reason above:
  //    `spend-own-levers-before-escalation` lists `--as overruled` in its human column, beside
  //    `--as approved`. a bare `overrule the malfunction` sits at one depth with
  //    `increase budget — yours to spend` and reads as a third lever the driver owns. it is not.
  if (hasOverrule) {
    const noun = input.passage === 'malfunction' ? 'malfunction' : 'constraint';
    groups.push({
      label: `overrule the ${noun} — a human must grant`,
      cmd: `rhx route.stone.set --stone ${input.stone} --as overruled`,
    });
  }

  // 3 — the tail. an exhaustion earns `approve as-is`; an overrule-only halt earns the prose
  //     "or fix the reviewer" instead, because no budget remedy applies to it.
  if (hasBudget) {
    groups.push({
      label: `approve as-is — a human must grant`,
      cmd: `rhx route.stone.set --stone ${input.stone} --as approved`,
    });
  } else if (hasOverrule) {
    groups.push({ label: `or fix the reviewer, then retry`, cmd: null });
  }

  return groups;
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
