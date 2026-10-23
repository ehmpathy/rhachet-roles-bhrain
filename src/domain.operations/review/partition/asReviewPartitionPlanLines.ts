import { asCountHuman } from '@src/domain.operations/review/asCountHuman';
import { asFigureHuman } from '@src/domain.operations/review/meter/asFigureHuman';
import { asCountedNoun } from '@src/utils/asCountedNoun';

import { asReviewPartitionUnclaimedLabel } from './asReviewPartitionUnclaimedLabel';
import { asReviewPartitionUnmatchedLines } from './asReviewPartitionUnmatchedLines';
import { getAllGlobsUnmatchedOfSplit } from './getAllGlobsUnmatchedOfSplit';
import type { ReviewPartitionSplit } from './getAllTargetsByPartition';
import type {
  ReviewPartitionCost,
  ReviewPartitionMass,
} from './getOneReviewPartitionCosts';

/**
 * .what = one mass, as `18 files   41.0k tokens`, aligned so a column of them scans
 * .note = the token figure reads through `asFigureHuman`, the one scale every other breadth
 *         renders a token count with, so a partition's mass reads alike in the plan and the
 *         refusal — and is never rounded up past the window it is meant to size
 */
const asMassText = (input: { mass: ReviewPartitionMass }): string =>
  `${asCountedNoun({ count: input.mass.files, one: 'file', many: 'files' }, { padCount: 3, align: true, figure: (count) => asCountHuman({ of: count }) })}  ${asFigureHuman({ of: input.mass.tokens }).padStart(6)} tokens`;

/**
 * .what = the `globs` and `cost` sub-branches of one node of the plan
 * .why = the declaration and its price are two questions, so each is its own branch: `globs`
 *        is the declaration verbatim, `cost` is what it weighs (seed S44)
 */
const asNodeLines = (input: {
  indent: string;
  globs: string[];
  cost: string[];
}): string[] => [
  `${input.indent}├─ globs`,
  ...input.globs.map(
    (glob, index) =>
      `${input.indent}│  ${index === input.globs.length - 1 ? '└─' : '├─'} ${glob}`,
  ),
  `${input.indent}└─ cost`,
  ...input.cost.map(
    (line, index) =>
      `${input.indent}   ${index === input.cost.length - 1 ? '└─' : '├─'} ${line}`,
  ),
];

/**
 * .what = the globs declared, verbatim, in two or more partitions
 * .why = the common set is computed from files, so it has no declaration of its own; the
 *        globs the partitions share verbatim are how a reader sees where the overlap was
 *        written
 */
const asGlobsShared = (input: { split: ReviewPartitionSplit }): string[] => {
  const globs = input.split.partitions.flatMap((partition) => partition.globs);
  const shared = globs.filter(
    (glob, index) =>
      globs.indexOf(glob) === index && globs.lastIndexOf(glob) !== index,
  );
  return shared.length > 0 ? shared : ['(no glob shared verbatim)'];
};

/**
 * .what = the plan of a declared split — `common` and `narrow` as peer branches, each slug a
 *         sub-branch of `narrow`, each node split into `globs` and `cost`
 * .why = `--mode plan` and `route.guard.partition` show a caller what their declaration
 *        would send, before any brain is called (seed S44)
 */
export const asReviewPartitionPlanLines = (input: {
  split: ReviewPartitionSplit;
  costs: { common: ReviewPartitionMass; partitions: ReviewPartitionCost[] };
  /** the route the run was driven from, whose spec glob is never flagged; null for none */
  route: string | null;
}): string[] => {
  const slugs = input.costs.partitions;
  return [
    // the head echoes the flag as typed, never a `(plan)` paraphrase of it, so a reader
    // sees the exact mode that made this preview (as `route.guard.partition` heads do)
    `🦉 review --mode plan — split into ${asCountedNoun({ count: slugs.length, one: 'partition', many: 'partitions' })}`,
    '   ├─ common',
    ...asNodeLines({
      indent: '   │  ',
      globs: asGlobsShared({ split: input.split }),
      // labeled as each narrow node's rows are, so every `cost` node reads one shape
      cost: [`common: ${asMassText({ mass: input.costs.common })}`],
    }),
    '   ├─ narrow',
    ...slugs.flatMap((cost, index) => {
      const isLast = index === slugs.length - 1;
      const partition = input.split.partitions[index]!;
      return [
        `   │  ${isLast ? '└─' : '├─'} ${cost.name}`,
        ...asNodeLines({
          indent: `   │  ${isLast ? '   ' : '│  '}`,
          globs: partition.globs,
          cost: [
            `narrow: ${asMassText({ mass: cost.narrow })}`,
            `common: ${asMassText({ mass: cost.common })}`,
            `total:  ${asMassText({ mass: cost.total })} ${cost.total.fits ? '✓' : '✗ exceeds the window'}`,
          ],
        }),
      ];
    }),
    ...asReviewPartitionUnmatchedLines({
      unmatched: getAllGlobsUnmatchedOfSplit({
        split: input.split,
        route: input.route,
      }),
      indent: '   ',
      cure: null,
    }),
    `   └─ ${asReviewPartitionUnclaimedLabel({ split: input.split })}`,
  ];
};
