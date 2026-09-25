/**
 * .what = formats the precondition confrontation — a promise arrived with no ask on record
 * .why = the whole adjudication is keyed on the ask. with no `.since` on disk there is no
 *        datum for the freshness bar and none for the haste cue, so a promise adjudicated
 *        here would clear on two gates that cannot run rather than on two gates that passed
 *
 * 🔴 .note = the state is REACHABLE, never theoretical. a rewind archives every `.since` and
 *            `.uptil` for a stone in one move, and the natural next act of a driver who holds
 *            the slug is to re-promise it — the hashless promise is advertised as a firm
 *            checkpoint, so no line of the design says an ask must be re-minted first.
 * 🔴 .note = what it prevents is a LAUNDERED ask. absent this verdict, the adjudication mints
 *            a fresh `.since` dated now, so a pre-rewind articulation reads as fresh against a
 *            timestamp that postdates it — the exact defect the freshness bar exists to catch,
 *            entered from the other side.
 * .note = it names no haste and no path. the driver's file may be perfect; what is absent is
 *         the ask it would answer, and one command mints that.
 */
export const formatNoAskOnRecord = (input: {
  stone: string;
  slug: string;
}): string[] => {
  // .note = deliberate mutation — a line accumulator, scoped to this call and shared with
  //         no caller. it is the shape every extant tree formatter here takes
  const lines: string[] = [];

  lines.push(`🍃 no ask on record`);
  lines.push(`   │`);
  lines.push(`   ├─ this review was never asked for, or its ask was rewound`);
  lines.push(`   │  ├─ stone = ${input.stone}`);
  lines.push(`   │  └─ slug  = ${input.slug}`);
  lines.push(`   │`);
  lines.push(
    `   ├─ a promise answers an ask. with no ask, two gates cannot run —`,
  );
  lines.push(
    `   │  the freshness bar has no date to measure, and the haste cue has no start`,
  );
  lines.push(`   │`);
  lines.push(`   ├─ ask for it, and the guard hands you the path`);
  lines.push(`   │  └─ rhx route.stone.set --stone ${input.stone} --as passed`);
  lines.push(`   │`);
  lines.push(`   └─ then promise again 🍵`);

  return lines;
};
