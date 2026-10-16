import { getOneLocusChars } from '@src/domain.operations/review/meter/getOneLocusChars';

/**
 * .what = one directory's share of the target mass
 * .why = named because three parties read it — the rollup that computes it, the
 *        renderer that prints it, and the test that pins it
 */
export interface TargetLocusRow {
  /** the directory, truncated to the rollup depth */
  dir: string;
  /** how many target files sit under it */
  files: number;
  /** their summed chars */
  chars: number;
  /** their share of the whole target mass, 0..1; null where the total is zero */
  share: number | null;
}

/**
 * .what = rolls a target corpus up by directory, so a reader can see which
 *         directories carry the prompt's mass
 * .why = a composition by named INPUT states the size and withholds the address:
 *        `targetFiles is 87.6% of 1.0M chars` is true and actionable by nobody,
 *        because it names the KIND of input rather than the PLACE it came from. so it
 *        cannot part mass a lane needs from mass a glob swept in, and a reader who
 *        wants to prune has a total with no target
 *        (rule.require.report-both-cost-levers-with-trend-and-locus).
 *
 * .note = `depth` is a path-segment count, not a character budget. a corpus whose every
 *         target shares one deep directory rolls up to ONE row at a shallow depth, which
 *         is a true answer and a useless one — so callers may raise the depth and
 *         re-read. the default of 3 suits a `src/<domain>/<area>` tree.
 *
 * .note = `depth` counts DIRECTORY segments, so a row is always a directory: a file
 *         shallower than the depth rolls up to its own parent, never to itself.
 *         only a root-level file, which has no directory, keys to its own path —
 *         it is a real target and its chars must reach the sum, or the shares stop
 *         to sum to 1 and the renderer silently understates the total
 *         (rule.require.distinguish-every-review-input).
 *
 * .note = rows sort by chars DESC, never by path. the question this answers is "what is
 *         big enough to prune", so the heaviest row comes first.
 */
export const getOneTargetLocusRollup = (input: {
  /** one entry per target: its path, and the chars it contributed to the prompt */
  targets: { path: string; chars: number }[];
  /** how many leading path segments to group by (default 3) */
  depth?: number;
}): { rows: TargetLocusRow[]; chars: number; files: number } => {
  const depth = input.depth ?? 3;
  const charsTotal = getOneLocusChars({ rows: input.targets });

  // group every target under its truncated directory; a shallow path keys to itself
  // .note = deliberate mutation, and a SCOPED ZONE — `byDir` is born here and only its
  //         entries leave, spread into a fresh array below, so the map itself never
  //         escapes (rule.require.immutable-vars).
  const byDir = new Map<string, { files: number; chars: number }>();
  for (const target of input.targets) {
    // the key is the file's DIRECTORY, truncated — never the file. a file shallower
    // than the depth keys to its own parent, so 40 files under `blackbox/` fold to one
    // prunable row rather than 40 one-file rows the header would miscount as dirs
    const dirs = target.path.split('/').slice(0, -1);
    const key =
      dirs.length === 0 ? target.path : dirs.slice(0, depth).join('/');
    const extant = byDir.get(key) ?? { files: 0, chars: 0 };
    byDir.set(key, {
      files: extant.files + 1,
      chars: extant.chars + target.chars,
    });
  }

  // a share over a zero total is undefined, never 0: it reads `null`, which the render
  // prints as the absent mark (rule.forbid.failhide — the getOneCacheHitRate law)
  const rowsUnordered = [...byDir.entries()].map(([dir, agg]) => ({
    dir,
    files: agg.files,
    chars: agg.chars,
    share: charsTotal === 0 ? null : agg.chars / charsTotal,
  }));

  // clone before the sort, so the order of no list but this copy can change
  const rows = [...rowsUnordered].sort((a, b) => asCharsOrder({ a, b }));

  return { rows, chars: charsTotal, files: input.targets.length };
};

/**
 * .what = the order of locus rows by chars, heaviest first
 * .why = names the sort, so the rollup states its order by name rather than by a closure
 *        to decode (rule.require.named-transformers)
 */
const asCharsOrder = (input: {
  a: TargetLocusRow;
  b: TargetLocusRow;
}): number => input.b.chars - input.a.chars;
