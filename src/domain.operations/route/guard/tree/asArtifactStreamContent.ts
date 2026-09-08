/**
 * .what = reads one stream's text back out of a rendered artifact tree bucket
 * .why = a cached judge or review is reconstructed by a RE-PARSE of the artifact file
 *        it wrote earlier, so the render grammar is also a read grammar. that pair was
 *        implicit — the writer lived in `formatTreeBucket`, the reader in a regex
 *        inside `runStoneGuardJudges` — and a change to one silently broke the other.
 *
 * 🔴 .measured = when the stream buckets learned to omit an empty stream, the last
 *    bucket correctly became its parent's final child: `└─ label` with a 3-space
 *    continuation column instead of `├─ label` with `│  `. the reader matched only
 *    the `├─`/`│  ` form, so it stopped to find the text and handed back `''` — and
 *    a cached judge lost its `passed` and its `reason` with NO error raised. the
 *    round-trip test beside this file is what makes that impossible to repeat.
 *
 * .note = the deeper defect stands: a cache that re-parses its own rendered prose is
 *         fragile by construction, and the durable repair is a structured sidecar.
 *         caught at `.dream/v2026_09_04.fix.judge-cache-reparses-its-own-render.md`
 */

/**
 * .what = the continuation column beneath a bucket label
 * .why = `formatTreeBucket` emits `│  ` for a middle child and three spaces for a
 *        last child, so every read must accept either
 */
const COLUMN = '(?:\\u2502 {2}| {3})';

export const asArtifactStreamContent = (input: {
  /**
   * the full rendered artifact content, as written to disk
   */
  content: string;

  /**
   * the bucket label to read — `stdout` or `stderr`
   */
  label: string;
}): string => {
  // the label marker is `└─` when the bucket is its parent's last child, else `├─`
  const pattern = new RegExp(
    `[\\u251c\\u2514]\\u2500 ${input.label}\\n` +
      `${COLUMN}\\u251c\\u2500\\n${COLUMN}\\u2502\\n` +
      `([\\s\\S]*?)` +
      `${COLUMN}\\u2502\\n${COLUMN}\\u2514\\u2500`,
  );

  const matched = input.content.match(pattern);
  if (!matched?.[1]) return '';

  // each content line carries the column plus the bucket's own `│  ` border
  return matched[1]
    .split('\n')
    .map((line) => line.replace(/^(?:\u2502 {2}| {3})\u2502 {2}/, ''))
    .join('\n')
    .trim();
};
