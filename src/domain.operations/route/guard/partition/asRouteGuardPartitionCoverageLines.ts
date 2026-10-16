// a sanctioned exposure, declared in src/domain.operations/review/partition/.readme.md
import { isPathOfRouteSpec } from '@src/domain.operations/review/isPathOfRouteSpec';
import {
  asReviewPartitionRepairLines,
  asReviewPartitionRepairTipLines,
} from '@src/domain.operations/review/partition/asReviewPartitionRepairLines';
import type { ReviewPartitionSplit } from '@src/domain.operations/review/partition/getAllTargetsByPartition';
import { asCountedNoun } from '@src/utils/asCountedNoun';

import {
  asPathListLines,
  CAP_OF_PATHS_LISTED,
  CAP_OF_PATHS_UNCLAIMED,
} from './asPathListLines';
import { asRouteGuardPartitionHeadLines } from './asRouteGuardPartitionHeadLines';
import { asRouteGuardPartitionScopeLabel } from './asRouteGuardPartitionScopeLabel';
import { asRouteGuardPartitionSplitLabels } from './asRouteGuardPartitionSplitLabels';
import type { StoneGuardPartitionCoverage } from './getOneStoneGuardPartitionCoverage';

/**
 * .what = how many rows each kind of list shows; null lists every row
 * .why = unclaimed paths are the actionable gap, so they get the wider cap
 */
interface CoverageListLimits {
  paths: number | null;
  unclaimed: number | null;
}

/**
 * .what = the slugs of every partition that carries a common file, in declared order
 * .why = a named projection, so a common row reads "who shares it" rather than an inline
 *        filter + map to simulate (rule.forbid.inline-decode-friction)
 */
const getAllSlugsThatShare = (input: {
  path: string;
  split: ReviewPartitionSplit;
}): string[] =>
  input.split.partitions
    .filter((partition) => partition.common.includes(input.path))
    .map((partition) => partition.name);

/**
 * .what = the branch char for item `index` of `total`
 */
const asBranch = (input: { index: number; total: number }): string =>
  input.index === input.total - 1 ? '└─' : '├─';

/**
 * .what = how a scope reads in the coverage tree, with the reviewers that read it
 */
const asScopeLabel = (input: {
  coverage: StoneGuardPartitionCoverage;
}): string => {
  const label = asRouteGuardPartitionScopeLabel({
    scope: input.coverage.scope,
  });
  const peers = input.coverage.peers;
  if (peers === null) return `scope ${label}`;
  return `scope ${label} — read by ${peers.join(', ')}`;
};

/**
 * .what = each partition of a scope, with the files it alone claims listed beneath it
 * .why = every partition reads alike — one named `rest` included — so the read rewards no
 *        catch-all (seed S52)
 */
const asLinesOfPartitions = (input: {
  split: ReviewPartitionSplit;
  tokensByPath: Map<string, number>;
  indent: string;
  limits: CoverageListLimits;
}): string[] => {
  // the row words the declaration tree shares
  const labels = asRouteGuardPartitionSplitLabels({
    split: input.split,
    tokensByPath: input.tokensByPath,
  });
  return [
    `${input.indent}├─ partitions`,
    ...input.split.partitions.flatMap((partition, index, all) => {
      const branch = asBranch({ index, total: all.length });
      const sub = `${input.indent}│  ${index === all.length - 1 ? '   ' : '│  '}`;
      const head = `${input.indent}│  ${branch} ${labels.partitions[index]}`;
      return [
        head,
        ...asPathListLines({
          rows: partition.narrow,
          limit: input.limits.paths,
          gutter: sub,
          closes: true,
        }),
      ];
    }),
  ];
};

/**
 * .what = the files two or more partitions share — the route spec as one count, every other
 *         shared file with the slugs that carry it
 */
const asLinesOfCommon = (input: {
  split: ReviewPartitionSplit;
  route: string;
  indent: string;
  limits: CoverageListLimits;
}): string[] => {
  // the route spec rides every partition by construction, so it counts apart from the
  // shared files a driver chose — else each spec file would list every slug
  const spec = input.split.common.filter((path) =>
    isPathOfRouteSpec({ path, route: input.route }),
  );
  const shared = input.split.common.filter(
    (path) => !isPathOfRouteSpec({ path, route: input.route }),
  );
  return [
    `${input.indent}├─ common: ${input.split.common.length} (route spec: ${spec.length})`,
    ...asPathListLines({
      rows: shared.map(
        (path) =>
          `${path} → ${getAllSlugsThatShare({ path, split: input.split }).join(', ')}`,
      ),
      limit: input.limits.paths,
      gutter: `${input.indent}│  `,
      closes: true,
    }),
  ];
};

/**
 * .what = the files no partition claims, listed, and the partitions that lack the route spec
 */
const asLinesOfGap = (input: {
  split: ReviewPartitionSplit;
  indent: string;
  limits: CoverageListLimits;
}): string[] => [
  `${input.indent}├─ ${asRouteGuardPartitionSplitLabels({ split: input.split, tokensByPath: null }).unclaimed}`,
  ...asPathListLines({
    rows: input.split.unclaimed,
    limit: input.limits.unclaimed,
    gutter: `${input.indent}│  `,
    closes: true,
  }),
  ...(input.split.routeAbsentFrom.length > 0
    ? [
        `${input.indent}├─ route spec absent from: ${input.split.routeAbsentFrom.join(', ')}`,
      ]
    : []),
];

/**
 * .what = one scope's whole coverage subtree
 */
const asLinesOfScope = (input: {
  coverage: StoneGuardPartitionCoverage;
  route: string;
  isLast: boolean;
  limits: CoverageListLimits;
}): string[] => {
  const indent = input.isLast ? '      ' : '   │  ';
  const gap = input.coverage.gap;

  // claim the route spec rides each partition only where the diff holds a spec file —
  // with none changed, the clause would be true of an empty set and read as a check made
  const hasRouteSpec = input.coverage.split.common.some((path) =>
    isPathOfRouteSpec({ path, route: input.route }),
  );
  const verdictHeld = hasRouteSpec
    ? 'verdict: holds — every changed file sits in a partition, each with the route spec'
    : 'verdict: holds — every changed file sits in a partition';

  // a held scope closes on its verdict; a gap closes on the one command that repairs it —
  // the same command the entrance gate prints, so the preview hands the driver the lever
  // the halt would, before a round is spent (i018 r014 nitpick.1)
  const verdictLines =
    gap === null
      ? [`${indent}└─ ${verdictHeld}`]
      : [
          `${indent}├─ verdict: gap — the entrance gate would halt here`,
          ...asReviewPartitionRepairLines({
            repair: { placed: gap.placed, command: gap.command },
            indent,
            caption: 'repair — run this before you arrive',
          }).command,
        ];
  return [
    `   ${input.isLast ? '└─' : '├─'} ${asScopeLabel({ coverage: input.coverage })}`,
    ...asLinesOfPartitions({
      split: input.coverage.split,
      tokensByPath: input.coverage.tokensByPath,
      indent,
      limits: input.limits,
    }),
    ...asLinesOfCommon({
      split: input.coverage.split,
      route: input.route,
      indent,
      limits: input.limits,
    }),
    ...asLinesOfGap({
      split: input.coverage.split,
      indent,
      limits: input.limits,
    }),
    ...verdictLines,
  ];
};

/**
 * .what = the stdout tree of a coverage read: every changed file, the partition that claims
 *         it, and the files none claims — per scope
 * .why = 🔴 a driver must learn whether a new file is claimed BEFORE `--as arrived` starts a
 *        paid round. this renders the very computation the entrance gate runs
 *        (`getAllStoneGuardPartitionCoverage`), so the preview and the gate cannot disagree
 *
 * .note = a read: it says so in its owl line, and it never names `--mode apply`
 * .note = each per-file list shows a head and names its remainder; the counts and the
 *         verdict always show. `full` lists every path
 */
export const asRouteGuardPartitionCoverageLines = (input: {
  route: string;
  /** the stone whose reviewers were read; null for the route's @all set alone */
  stone: string | null;
  coverages: StoneGuardPartitionCoverage[];
  /** whether to list every path, rather than a head of each list */
  full: boolean;
}): string[] => {
  // the shared head, the stone, and the branch the scopes were checked against
  const head = [
    '🦉 coverage read — naught written, no review run',
    '',
    ...asRouteGuardPartitionHeadLines({
      route: input.route,
      scope: null,
      mode: null,
      peerNote: null,
    }),
    ...(input.stone === null ? [] : [`   ├─ stone = ${input.stone}`]),
  ];

  // no scope to read: say why on one line
  const first = input.coverages[0];
  if (!first)
    return [
      ...head,
      '   └─ declared: none — no reviewer here reads a partition set, so every lane runs whole',
    ];

  // each scope's subtree, under the count of files it was checked against
  const limits: CoverageListLimits = input.full
    ? { paths: null, unclaimed: null }
    : { paths: CAP_OF_PATHS_LISTED, unclaimed: CAP_OF_PATHS_UNCLAIMED };
  return [
    ...head,
    `   ├─ checked against ${asCountedNoun({ count: first.targets.length, one: 'file', many: 'files' })} changed since main`,
    ...input.coverages.flatMap((coverage, index) =>
      asLinesOfScope({
        coverage,
        route: input.route,
        isLast: index === input.coverages.length - 1,
        limits,
      }),
    ),
    // a gap's repair closes on the tip, once, after the whole tree
    ...(input.coverages.some((coverage) => coverage.gap !== null)
      ? asReviewPartitionRepairTipLines()
      : []),
  ];
};
