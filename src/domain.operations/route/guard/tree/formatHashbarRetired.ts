/**
 * .what = formats the one-line retirement notice for a `.guard` that still sets `hashbar:`
 * .why = three outcomes were available and they are not equally kind. a THROW halts a whole
 *        route on a key that was correct when it was written. SILENCE lets the author carry
 *        a dead key into the next guard they author. one line does neither.
 *
 * .note = the message is not a deprecation notice — it is the answer to a question the author
 *         asked months ago. every author who set this key had hit the reset defect and routed
 *         around it, so the knob is best read as a bug report written in yaml.
 * .note = it states that the workaround NEVER fired, deliberately. "you no longer need this"
 *         leaves an author to wonder why their route misbehaved anyway; "this never did what
 *         you thought, and the reason you wanted it is gone" is the honest sentence.
 */
export const formatHashbarRetired = (input: {
  found: { stone: string; slug: string }[];
}): string[] => {
  if (input.found.length === 0) return [];

  // .note = deliberate mutation — a line accumulator, scoped to this call and shared with
  //         no caller. the tree shape is conditional, so an immutable build is a chain of
  //         spreads that reads worse than the tree it renders (rule.require.immutable-vars).
  //         it is also the shape every extant tree formatter here takes
  const lines: string[] = [];

  lines.push(`🗿 hashbar is retired`);
  lines.push(`   │`);
  for (const at of input.found)
    lines.push(`   ├─ found in ${at.stone} → review.self.${at.slug}`);
  lines.push(`   │`);
  lines.push(
    `   ├─ the trigger report is hashless now, so a repair never resets the clock`,
  );
  lines.push(`   │  ├─ hashbar was the workaround for exactly that`);
  lines.push(
    `   │  └─ it never fired — the persist branch read the NEWEST trigger, so a`,
  );
  lines.push(
    `   │     new hash reset it anyway. the defect it aimed at is gone at the root`,
  );
  lines.push(`   │`);
  lines.push(`   └─ safe to delete the key 🍵`);

  return lines;
};
