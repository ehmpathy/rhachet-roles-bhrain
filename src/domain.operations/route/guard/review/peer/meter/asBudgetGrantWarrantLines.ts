/**
 * .what = the tree rows a GRANTED budget top-up renders to name the warrant that earned it
 * .why = a grant records which fact it read, beside the fact itself. the predicate reads a live
 *        urgent concession off disk; these rows state which reviewer's concession it was, so the
 *        record is legible in the render rather than in `passage.jsonl` alone.
 *
 * 🔴 .a grant through this command ALWAYS has a warrant, so these rows are unconditional.
 *    `computeBudgetGrantRefusal` returns `{ kind: 'no-warrant' }` on an empty slug set, so the
 *    write below it is reachable only where at least one live urgent concession stands. ⇒ no
 *    `if (slugs.length)` guard is owed here, and one would read as a live case that cannot arise
 *    (`rule.forbid.unexpected-defaults`).
 *
 * 🟡 .it names REVIEWERS, never concerns.
 *    the operation that computes the warrant dedupes by reviewer — its own docblock states why —
 *    so no concern ordinal reaches this seat. to re-read the corpus here for one would derive the
 *    warrant a SECOND way, and two derivations can disagree. ⇒ the render states what the gate
 *    actually read.
 *
 * 🔴 .the warn is an ask of the driver, never a notification the engine sends.
 *    it is an obligation the driver discharges, in prose it writes. no mechanism mails anyone.
 *    ⇒ the row is imperative and addressed to the reader; a passive *"your human is warned"*
 *    names no actor (`rule.avoid.passive-voice`) and reads as a notice already delivered, so a
 *    driver that trusts it writes naught and the human meets the spend as an unexplained diff.
 *
 * 🟡 .the scope named is the STONE, never a pull or a tree.
 *    budget is granted per stone (`--stone`), so the stone is what bought it and what a human
 *    asks about. a pull may hold many stones, or none of this one's rounds.
 *
 * 🟡 .and the ask is REPEATED here, which is the point.
 *    the concede ack asks for the same sentence at the moment of the grade; this asks again at the
 *    moment of the spend. a driver reads the ack once and this on every grant, so the ask lands
 *    beside the act that owes it.
 *
 * 🔴 .the granted row carries NO glyph; the warn row does.
 *    a glyph marks the *"important callout"* `rule.prefer.chill-nature-emojis` reserves one for, so
 *    the warn earns one and the confirm does not — the row already says `granted`, and a glyph on
 *    it is a second copy of one word that dilutes the glyph a reader must act on. the repo's shape
 *    agrees: a glyph sits in the HEADER and the TAIL, never on the rows between
 *    (`asPrivilegeGrantedLines` confirms a grant across six bare rows).
 *
 * 🟡 .the block sits ABOVE `updates`.
 *    `updates` is the render's final branch and its child rows are indented against a `└─`, so a
 *    row after it would hang off a closed branch (`rule.require.treestruct-output`). the reason
 *    before the effect also reads in the order a driver asks it: what earned this, then what it
 *    changed.
 */
export const asBudgetGrantWarrantLines = (input: {
  /** the reviewers with a live urgent concession that earned this round */
  warrantSlugs: string[];
}): string[] => [
  '   │',
  '   ├─ granted — earned by a live urgent concession',
  ...input.warrantSlugs.map((slug, i) => {
    const prefix =
      i === input.warrantSlugs.length - 1 ? '   │  └─' : '   │  ├─';
    return `${prefix} ${slug} · conceded urgent`;
  }),
  '   │',
  '   ├─ 🟡 tell your human why this stone bought budget',
  '   │',
];
