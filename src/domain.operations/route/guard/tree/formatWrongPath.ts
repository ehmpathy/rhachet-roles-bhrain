/**
 * .what = formats the path-mismatch confrontation, as a DIFF of two named operands
 * .why = a check with one operand reports a failure; it takes two to report a difference
 *
 * .note = this is why `--into` is required. before it, a wrong path surfaced as
 *         `the articulation is absent`, which names only where the guard looked and leaves
 *         the driver to guess what it read instead. with both operands the emit can say
 *         "you named X, it is owed at Y", and hand over the move command.
 * .note = it names NO haste and demands NO wait. a driver whose real defect is a path must
 *         never be told to slow down — they would pay a round trip to learn the wrong lesson.
 */
export const formatWrongPath = (input: {
  owed: string;
  declared: string | undefined;
}): string[] => {
  // .note = deliberate mutation — a line accumulator, scoped to this call and shared with
  //         no caller. the tree shape is conditional, so an immutable build is a chain of
  //         spreads that reads worse than the tree it renders (rule.require.immutable-vars).
  //         it is also the shape every extant tree formatter here takes
  const lines: string[] = [];

  lines.push(`🍃 not quite there`);
  lines.push(`   │`);
  lines.push(`   ├─ the path you named is not the path that is owed`);
  lines.push(`   │  ├─ you named  = ${input.declared ?? '(none)'}`);
  lines.push(`   │  └─ it is owed = ${input.owed}`);
  lines.push(`   │`);

  // the move command, ready to paste — only where a source path exists to move
  if (input.declared) {
    lines.push(`   ├─ if the file is where you named it, move it`);
    lines.push(
      `   │  └─ rhx mvsafe --from ${input.declared} --into ${input.owed}`,
    );
    lines.push(`   │`);
  }

  lines.push(`   └─ then promise again, with --into set to the owed path 🍵`);

  return lines;
};
