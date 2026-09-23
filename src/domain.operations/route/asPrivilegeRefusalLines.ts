/**
 * .what = the refusal a non-human caller reads instead of a privilege grant, as tree rows
 * .why = this owns HOW the tree is shaped — the `├─`/`└─` connectors, the nested `│` spacer, the
 *        blank rows at each end — so the caller reads `refused → emit → exit` and the
 *        `process.exit(2)` beneath it reads as the terminal act
 *        (`rule.prefer.decomposable-architecture`).
 *
 * 🔴 .it is a PURE builder, so the i/o stays at the boundary that owns it.
 *    the caller writes these to stderr, because a refusal is a constraint the caller must fix and
 *    stdout may be hidden on a non-zero exit (`rule.forbid.stdout-on-exit-errors`). a leaf that
 *    wrote its own lines would bury that choice one level down, where the exit code that justifies
 *    it is out of view.
 *
 * 🔴 .the second row states the BLAST RADIUS, and it is the whole argument for the gate.
 *    the flag this grant writes lifts every protected write on the route at once — a `budget:` edit
 *    in a `.guard`, an appended `rounds: 0` line in the append-only meter. a driver told only
 *    "human only" learns a rule; a driver told what the flag lifts learns why the rule holds, and
 *    can judge whether its ask is worth a human's attention.
 *
 * .note = the remedy names TWO moves, and the second is the one a driver usually wants: drive the
 *         route as it stands. an escalation is the sanctioned path only where the road is genuinely
 *         held (`rule.always.spend-own-levers-before-escalation`), so the copy does not lead with it.
 */
export const asPrivilegeRefusalLines = (input: { route: string }): string[] => [
  ``,
  `🦉 privilege refused`,
  ``,
  `🗿 route.mutate grant allow`,
  `   ├─ route = ${input.route}`,
  `   ├─ refused — this grant is human only`,
  `   │  └─ the flag it writes lifts every protected write on the route at once`,
  `   │`,
  `   └─ what to do`,
  `      └─ ask a human to run it from a terminal, or drive the route as it stands`,
  ``,
];
