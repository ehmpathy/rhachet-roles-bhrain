import { asCountHuman } from '@src/domain.operations/review/asCountHuman';
import { getOneTargetLocusRollup } from '@src/domain.operations/review/meter/getOneTargetLocusRollup';
import { asCountedNoun } from '@src/utils/asCountedNoun';

import { asReviewPartitionRepair } from './asReviewPartitionRepair';
import {
  asReviewPartitionRepairLines,
  asReviewPartitionRepairTipLines,
} from './asReviewPartitionRepairLines';
import { CLAUSE_OF_PARTITION_UNDER_GUARD } from './CLAUSE_OF_PARTITION_UNDER_GUARD';
import type { ReviewPartitionSplit } from './getAllTargetsByPartition';
import type { ReviewPartitionCost } from './getOneReviewPartitionCosts';

/**
 * .what = the words that introduce a repair, per the form its text takes
 * .why = a claim, a whole declaration, and flags to add beside the caller's own are three
 *        different acts; the caption names the act, so a driver never re-types a set to paste
 *        a claim
 */
const CAPTION_OF_REPAIR_FORM: Record<'claim' | 'declare' | 'append', string> = {
  claim: 'repair — run this to claim each gap into its partition',
  declare: 'repair — run this to declare the repaired set',
  append: 'repair — re-run with these --partition flags beside yours',
};

/**
 * .what = how many paths a refusal lists before it summarizes the rest
 */
const PATHS_LISTED_MAX = 12;

/**
 * .what = a tree branch of paths, truncated with the remainder named
 */
const asPathLines = (input: { paths: string[]; indent: string }): string[] => {
  const shown = input.paths.slice(0, PATHS_LISTED_MAX);
  const more = input.paths.length - shown.length;
  const lines = [
    ...shown.map((path) => `${path}`),
    ...(more > 0 ? [`… and ${more} more`] : []),
  ];
  return lines.map(
    (line, index) =>
      `${input.indent}${index === lines.length - 1 ? '└─' : '├─'} ${line}`,
  );
};

/**
 * .what = how many files a directory row may hold before the refusal splits it one deeper
 */
const LIMIT_OF_FILES_PER_ROW = 40;

/**
 * .what = the unclaimed set, rolled up by directory — and each heavy row split one level
 *         deeper, until it fits or no longer splits
 * .why = a fixed depth names `src/domain.operations/review` as one 462-file row, which is a
 *        true answer and no boundary at all: a vertical partition is cut BELOW it. so a row
 *        too heavy to be one partition is opened, and the driver reads the boundaries the
 *        code actually has, never a hand census (rule.forbid.adhoc-scope-rollups)
 */
const asUnclaimedRows = (input: {
  paths: string[];
  depth: number;
  /** each path's weight; absent paths weigh one, so a row's weight is its file count */
  tokensByPath?: Map<string, number>;
}): { dir: string; files: number; tokens: number }[] => {
  // roll up at this depth
  const rollup = getOneTargetLocusRollup({
    targets: input.paths.map((path) => ({
      path,
      chars: input.tokensByPath?.get(path) ?? 1,
    })),
    depth: input.depth,
  });

  // open each heavy row one level deeper, where that yields more than one row
  // .note = a row keyed shallower than the depth holds only the files that sit directly in
  //         it, so it has no subdirectory to open — only a full-depth row may split. that is
  //         also what ends the recursion: each step is one segment deeper, and paths are finite
  return rollup.rows.flatMap((row) => {
    const isOpenable =
      row.files > LIMIT_OF_FILES_PER_ROW &&
      row.dir.split('/').length === input.depth;
    const whole = { dir: row.dir, files: row.files, tokens: row.chars };
    if (!isOpenable) return [whole];
    const deeper = asUnclaimedRows({
      paths: input.paths.filter((path) => path.startsWith(`${row.dir}/`)),
      depth: input.depth + 1,
      tokensByPath: input.tokensByPath,
    });
    return deeper.length > 1 ? deeper : [whole];
  });
};

/**
 * .what = the unclaimed set, as a tree branch: each path while few, else each directory
 * .why = the fix is a glob, and a glob names a directory. a list cut at twelve paths hides
 *        the rest, so a driver who wants the whole gap must census it by hand
 *        (rule.forbid.adhoc-scope-rollups) — so past twelve, every directory is named with
 *        its count, and none is truncated
 */
const asUnclaimedLines = (input: { paths: string[] }): string[] => {
  // few enough to name each one
  if (input.paths.length <= PATHS_LISTED_MAX)
    return [
      '   ├─ unclaimed',
      ...asPathLines({ paths: input.paths, indent: '   │  ' }),
    ];

  // else, one row per directory, heavy rows opened, heaviest first, all of them
  const rows = [...asUnclaimedRows({ paths: input.paths, depth: 3 })].sort(
    (a, b) => asFilesOrder({ a, b }),
  );
  return [
    `   ├─ unclaimed, by directory (${asCountedNoun({ count: rows.length, one: 'directory', many: 'directories' })})`,
    ...rows.map(
      (row, index) =>
        `   │  ${index === rows.length - 1 ? '└─' : '├─'} ${asCountedNoun({ count: row.files, one: 'file', many: 'files' }).padStart(9)}  ${row.dir}`,
    ),
  ];
};

/**
 * .what = the order of unclaimed rows by file count, fullest first
 * .why = names the sort, so the rollup states its order by name rather than by a closure
 *        to decode (rule.require.named-transformers)
 */
const asFilesOrder = (input: {
  a: { files: number };
  b: { files: number };
}): number => input.b.files - input.a.files;

/**
 * .what = the order of locus rows by token weight, heaviest first
 */
const asTokensOrder = (input: {
  a: { tokens: number };
  b: { tokens: number };
}): number => input.b.tokens - input.a.tokens;

/**
 * .what = one overflowed partition, with where its mass sits: the share it holds in common,
 *         and its own targets by directory, heaviest first
 * .why = 🔴 a refusal that names only a total leaves the driver to census the partition by
 *        hand to find a seam (rule.forbid.adhoc-scope-rollups). the directories ARE the
 *        candidate seams of a vertical split, so the refusal names them, with their weight,
 *        and the excess a narrower cut must shed
 */
const asOverflowLocusLines = (input: {
  cost: ReviewPartitionCost;
  narrow: string[];
  tokensByPath: Map<string, number> | null;
}): string[] => {
  // the headline row: the partition, its weight, and how far past the limit it sits
  const excess = input.cost.total.tokens - input.cost.total.limit;
  const head = `   ├─ ${input.cost.name}: ~${asCountHuman({ of: input.cost.total.tokens })} tokens, ${asCountedNoun({ count: input.cost.total.files, one: 'file', many: 'files' })} — ~${asCountHuman({ of: excess })} over the ~${asCountHuman({ of: input.cost.total.limit })} limit`;

  // without per-path weights, the headline is all that can be said
  if (input.tokensByPath === null) return [head];

  // its own targets by directory, heaviest first; the rest named, never dropped
  const rows = [
    ...asUnclaimedRows({
      paths: input.narrow,
      depth: 3,
      tokensByPath: input.tokensByPath,
    }),
  ].sort((a, b) => asTokensOrder({ a, b }));
  const shown = rows.slice(0, PATHS_LISTED_MAX);
  const rest = rows.slice(PATHS_LISTED_MAX);
  const lines = [
    ...shown.map(
      (row) =>
        `${`~${asCountHuman({ of: row.tokens })}`.padStart(8)} tokens ${asCountedNoun({ count: row.files, one: 'file', many: 'files' }).padStart(9)}  ${row.dir}`,
    ),
    ...(rest.length > 0
      ? [
          `… and ${asCountedNoun({ count: rest.length, one: 'directory', many: 'directories' })} more, ~${asCountHuman({ of: rest.reduce((sum, row) => sum + row.tokens, 0) })} tokens`,
        ]
      : []),
  ];
  return [
    head,
    `   │  ├─ common: ~${asCountHuman({ of: input.cost.common.tokens })} tokens, ${asCountedNoun({ count: input.cost.common.files, one: 'file', many: 'files' })} — shared with other partitions, so it rides into every half of a split`,
    `   │  └─ its own, by directory — the seams a split can cut along`,
    ...lines.map(
      (line, index) =>
        `   │     ${index === lines.length - 1 ? '└─' : '├─'} ${line}`,
    ),
  ];
};

/**
 * .what = the unclaimed set beside a repair: where the repair places each file while few,
 *         else each directory with its count (the repaired command names every glob)
 * .why = a per-file placement of hundreds of files buries the command beneath it; past
 *        twelve, the directory rollup answers "what is unclaimed" and the command answers
 *        "where it goes"
 */
const asUnclaimedRepairLines = (input: {
  paths: string[];
  placed: string[];
}): string[] =>
  input.paths.length <= PATHS_LISTED_MAX
    ? ['   ├─ unclaimed → where the repair places each', ...input.placed]
    : asUnclaimedLines({ paths: input.paths });

/**
 * .what = the refusal a declared split earns, or null when the split is sound
 * .why = 🔴 each of these makes a split review less than the caller asked for, in silence —
 *        a target no partition grades, a partition that grades without the spec, a partition
 *        that cannot fit. each refuses (exit 2) before any brain is called, and names the fix
 *        (seed S44)
 *
 * .note = 🔴 the route check is a core requirement, never a warn: the route is the spec a
 *         reviewer grades against, so a partition without it grades blind. it fires only
 *         when a route is bound — a plain review has no spec to require
 */
export const asReviewPartitionRefusal = (input: {
  split: ReviewPartitionSplit;
  /** the per-partition costs; null where the run has not weighed the split */
  costs: ReviewPartitionCost[] | null;
  /** each target's tokens, so an overflow names where its mass sits; null where unweighed */
  tokensByPath: Map<string, number> | null;
  route: string | null;
  /**
   * the whole set the split came from, and the command that declares it — so a coverage
   * refusal carries the repaired set, paste-ready. `command` is null where the set is the
   * caller's own `--partition` flags. null where the caller has no set to repair
   */
  repairVia: {
    partition: string[];
    command: { head: string; tail: string } | null;
  } | null;
}): { headline: string; lines: string[] } | null => {
  // the repaired set, where the split has a coverage gap and a set to repair
  const isGapOfCoverage =
    input.split.unclaimed.length > 0 ||
    (input.route !== null && input.split.routeAbsentFrom.length > 0);
  const repair =
    input.repairVia && isGapOfCoverage
      ? asReviewPartitionRepair({
          partition: input.repairVia.partition,
          unclaimed: input.split.unclaimed,
          routeAbsentFrom:
            input.route === null ? [] : input.split.routeAbsentFrom,
          route: input.route,
          command: input.repairVia.command,
        })
      : null;
  const repairLines = repair
    ? asReviewPartitionRepairLines({
        repair,
        indent: '   ',
        caption: CAPTION_OF_REPAIR_FORM[repair.form],
      })
    : null;

  // a target in no partition would go unreviewed
  if (input.split.unclaimed.length > 0)
    return {
      headline: `${asCountedNoun({ count: input.split.unclaimed.length, one: 'target sits', many: 'targets sit' })} in no partition, so a split would leave targets unreviewed`,
      lines: [
        ...(repairLines
          ? [
              ...asUnclaimedRepairLines({
                paths: input.split.unclaimed,
                placed: repairLines.placed,
              }),
              ...repairLines.command,
            ]
          : [
              ...asUnclaimedLines({ paths: input.split.unclaimed }),
              `   └─ fix: add each to the partition of its domain, or declare one more named for its domain — e.g. --partition 'config=package.json'`,
            ]),
        // the tip rides after the whole tree, so a paste of the repair never carries it
        ...asReviewPartitionRepairTipLines(),
      ],
    };

  // a partition without the bound route grades without its spec
  if (input.route !== null && input.split.routeAbsentFrom.length > 0)
    return {
      headline: `the bound route is absent from ${asCountedNoun({ count: input.split.routeAbsentFrom.length, one: 'partition', many: 'partitions' })}; each must hold the spec it grades against`,
      lines: [
        `   ├─ route: ${input.route}`,
        '   ├─ absent from',
        ...asPathLines({
          paths: input.split.routeAbsentFrom,
          indent: '   │  ',
        }),
        ...(repairLines?.command ?? [
          `   └─ fix: add '${input.route}/**' to each partition's globs`,
        ]),
        ...asReviewPartitionRepairTipLines(),
      ],
    };

  // a partition that cannot fit would overflow inside the pour
  const overflowed = (input.costs ?? []).filter((cost) => !cost.total.fits);
  if (overflowed.length > 0)
    return {
      headline: `${asCountedNoun({ count: overflowed.length, one: 'partition still overflows', many: 'partitions still overflow' })} alone`,
      lines: [
        ...overflowed.flatMap((cost) =>
          asOverflowLocusLines({
            cost,
            narrow:
              input.split.partitions.find(
                (partition) => partition.name === cost.name,
              )?.narrow ?? [],
            tokensByPath: input.tokensByPath,
          }),
        ),
        '   ├─ fix: narrow that partition, or split it in two — the tool never splits a partition again',
        // a guarded lane declares its set through the guard, so the fix names that command too
        `   └─ redeclare the set with narrower --partition flags ${CLAUSE_OF_PARTITION_UNDER_GUARD}`,
      ],
    };

  return null;
};
