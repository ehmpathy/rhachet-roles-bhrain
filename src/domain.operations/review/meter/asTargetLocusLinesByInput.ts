import {
  NAMES_OF_TARGET_INPUT,
  type TargetInputName,
} from '@src/domain.operations/review/asTargetContentsByInput';
import {
  asFigureHuman,
  MARK_OF_ABSENT,
} from '@src/domain.operations/review/meter/asFigureHuman';
import {
  asTargetLocusLines,
  LABEL_OF_LOCUS,
  LIMIT_OF_LOCUS_ROWS,
} from '@src/domain.operations/review/meter/asTargetLocusLines';
import { getOneTargetLocusRollup } from '@src/domain.operations/review/meter/getOneTargetLocusRollup';

/**
 * .what = the word each target input reads as, beside a directory's chars
 * .why = `targetFiles` and `targetDiffs.mutations` are field names. a reader thinks in
 *        what the bytes ARE — the body of an edited file, a new file, the hunks of an edit
 */
const LABEL_OF_TARGET_INPUT: Record<TargetInputName, string> = {
  targetFiles: 'bodies',
  'targetDiffs.additions': 'added',
  'targetDiffs.deletions': 'deleted',
  'targetDiffs.mutations': 'edits',
};

/**
 * .what = the target locus as ONE table — one row per directory, each with its split by kind
 * .why = one table answers "which directory is heavy" at a glance, and the split on each
 *        row still answers "heavy with WHAT" — an edited body falls to a narrower bind; an
 *        addition falls only to a partition, so the lever needs the kind. a block per kind
 *        made the reader sum one directory across three blocks to find its weight.
 *        ONE render for every surface that draws the split — the overflow refusal and the
 *        run report — so they read alike (rule.forbid.duplicate-format-tree-operations ·
 *        rule.require.distinguish-every-review-input)
 *
 * .note = deletions carry no chars, so they have no mass to place; the census row
 *         states their count
 */
export const asTargetLocusLinesByInput = (input: {
  locus: Record<TargetInputName, { path: string; chars: number }[]>;
  /** the head prefix, up to and with its branch glyph — e.g. `   ├─ ` */
  head: string;
  /** the gutter each child row sits in — e.g. `   │  ` */
  gutter: string;
}): string[] => {
  const names = NAMES_OF_TARGET_INPUT.filter(
    (name) => name !== 'targetDiffs.deletions',
  );

  // every target of every kind, one entry per path, so a file sent as a body AND as
  // an edit counts once among the directory's files and twice in its chars
  const targets = getAllTargetsMergedByPath({
    entries: names.flatMap((name) => input.locus[name]),
  });

  // a prompt that sends no target mass has naught to place — a fact, so it says so
  if (targets.length === 0)
    return [`${input.head}${LABEL_OF_LOCUS} — none sent`];

  // per kind, the chars each directory carries, keyed exactly as the table keys its rows
  const charsByDirByName = names.map((name) => ({
    name,
    byDir: new Map(
      getOneTargetLocusRollup({ targets: input.locus[name] }).rows.map(
        (row) => [row.dir, row.chars] as const,
      ),
    ),
  }));

  return asTargetLocusLines({
    targets,
    limit: LIMIT_OF_LOCUS_ROWS,
    head: input.head,
    gutter: input.gutter,
    suffix: '',
    figure: asFigureHuman,
    absent: MARK_OF_ABSENT,
    detail: ({ dir }) =>
      charsByDirByName
        .filter(({ byDir }) => (byDir.get(dir) ?? 0) > 0)
        .map(
          ({ name, byDir }) =>
            `${asFigureHuman({ of: byDir.get(dir) ?? 0 })} ${LABEL_OF_TARGET_INPUT[name]}`,
        )
        .join(' · '),
  });
};

/**
 * .what = the target entries folded to one per path, their chars summed
 * .why = a directory's file count names distinct files, never entries
 */
const getAllTargetsMergedByPath = (input: {
  entries: { path: string; chars: number }[];
}): { path: string; chars: number }[] => {
  const charsByPath = input.entries.reduce(
    (acc, entry) =>
      acc.set(entry.path, (acc.get(entry.path) ?? 0) + entry.chars),
    new Map<string, number>(),
  );
  return [...charsByPath.entries()].map(([path, chars]) => ({ path, chars }));
};
