import * as path from 'path';

/**
 * .what = swaps the run-unique tokens out of a rendered guard emit, so a snapshot
 *         of it matches on every run and on every machine
 * .why = a guard emit carries tokens that differ per run: the scene's temp root — in
 *        both the absolute and the cwd-relative form — the 18-hex artifact hash, and the
 *        elapsed time of each reviewer and judge. a bare toMatchSnapshot on any emit
 *        that holds one of them is flaky by construction.
 *
 * 🔴 .note = it swaps ONLY those. the tree glyphs, the reviewer slug, the verdict, the
 *         `.given`/`.taken` filename grammar, and every word of the copy stay verbatim —
 *         those are exactly what a reviewer reads the snapshot to vibecheck. a
 *         normalizer wide enough to hide a reword would re-open the drift these
 *         snapshots exist to catch.
 *
 * 🔴 .note = it lives here, shared, because three suites needed it and each had drifted
 *         its own copy. that drift shipped two real defects, and the shared home is what
 *         let one edit close both:
 *
 *         1. two copies masked only a PARENTHESIZED duration — `\(\d+…s\)` — while the
 *            guard renders the reviewer and judge lines bare, as `rejected 0.0s`. so the
 *            mask never fired, and a runner slow enough to render `0.1s` would have gone
 *            red on an elapsed-time change no assertion cared about (r4 nitpick.2, i002)
 *         2. every copy swapped only the ABSOLUTE root, so a path the guard chose to
 *            render relative came out as `../../../../../..<route>/…` beside a plain
 *            `<route>/…` two lines later — one snapshot, two shapes for one kind of path
 *            (r7 blocker.1, i002)
 */
export const asStableGuardEmit = (input: {
  /**
   * 🔴 the emit TEXT, either stream — not stdout alone.
   *
   * it was named `stdout` until a caller had to stabilize a stderr block for a snapshot
   * and wrote `{ stdout: out.stderr }`, which reads as a defect at every later glance
   * (`rule.forbid.ambiguous-labels`). the operation was never stdout-specific: it swaps
   * run-unique tokens, and those tokens appear on both streams (r2 nitpick.1, i003).
   */
  emit: string | undefined;
  route: string;
}): string => {
  // 🔴 the guard renders some paths absolute and others relative to cwd, and BOTH forms
  //    appear in one emit. so both are swapped to the same token — a reader can then
  //    pattern-match every path in a snapshot against one shape, which is the whole
  //    point of `rule.forbid.snapshot-visual-blemishes`
  const routeRelative = path.relative(process.cwd(), input.route);

  // 🔴 the two forms NEST, and which one contains the other flips with where the scene
  //    lives — so a fixed order is wrong for one case or the other:
  //
  //    | the scene roots under | the relative form | nests as |
  //    |---|---|---|
  //    | `process.cwd()/.tmp`  | `.tmp/x`                    | a substring of the absolute |
  //    | `os.tmpdir()`         | `../../../../../../tmp/x`   | the absolute is a substring of IT |
  //
  //    swap the inner one first and it eats the tail of the outer one, which leaves a
  //    stranded fragment — `/home/…/<route>/…` in the first case, `../../..<route>/…`
  //    in the second. both were observed. so the rule is LONGEST FIRST, which is
  //    correct in both because the container is always the longer string.
  const [swapFirst, swapSecond] = [input.route, routeRelative].sort(
    (a, b) => b.length - a.length,
  ) as [string, string];

  return (
    (input.emit ?? '')
      .split(swapFirst)
      .join('<route>')
      .split(swapSecond)
      .join('<route>')
      // the artifact hash. NOT decoration — the temp root feeds the hash input, so one
      // varies with the other, and a pass that swapped only the root went red on the
      // very next run at the hash alone
      .replace(/\b[0-9a-f]{18}\b/g, '<hash>')
      // every duration, parenthesized or bare
      .replace(/\b\d+(\.\d+)?m?s\b/g, '<elapsed>')
  );
};
