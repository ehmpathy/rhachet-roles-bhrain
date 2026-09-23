/**
 * .what = the closed set of harm an `urgent` concession may name
 * .why = the set is closed on purpose — a driver that cannot place its concern in it holds a
 *        `better` concern, and a `better` concern earns no round past the meter. so the set is a
 *        DATUM rather than a sentence, and each surface joins it with the separator its own shape
 *        wants (`rule.require.single-source-of-truth-for-render`).
 *
 * 🔴 .three surfaces RENDER this set to a driver, which is the rule of three met rather than
 *    approached (`rule.prefer.wet-over-dry`):
 *      1. `route.ts` — the `route.stone.set --help` text
 *      2. `setStoneAsConcernAbsorbed.ts` — the ungraded-concede refusal
 *      3. `formatBudgetGrantRefusalLines.ts` — the budget refusal's grade tip
 *
 * ⚠️ .site 1 was MIS-FILED as prose before this extraction, and the mis-file is why the set
 *    survived two rounds unshared: a docblock counted two rendered sites and called the third a
 *    comment. it sits inside a usage string a driver reads, so it was always a render. ⇒ the
 *    lesson is that `help` text is contract-tier, and a census that sorts by FILE rather than by
 *    what reaches a reader will under-count every time.
 */
export const URGENT_HARM_KINDS = [
  'security',
  'safety',
  'monetary',
  'reputation',
  'behavioral',
] as const;

/**
 * .what = the closed harm set, joined for one surface
 * .why = the three renders differ ONLY in separator — `·` in a tree row, `|` inside a
 *        parenthetical. a separator is a format parameter, never a switch, so one shared renderer
 *        is what `rule.forbid.duplicate-format-tree-operations` prescribes rather than what
 *        `rule.prefer.wet-over-dry` warns against.
 *
 * .note = `·` is the canonical separator — every brief in this repo uses it. `|` is kept where the
 *         set sits inside a parenthetical, since a middle dot reads as prose there and a pipe
 *         reads as an enumeration.
 */
export const asUrgentHarmSet = (input: { separator: string }): string =>
  URGENT_HARM_KINDS.join(input.separator);
