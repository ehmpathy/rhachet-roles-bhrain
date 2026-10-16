// a sanctioned exposure, declared in src/domain.operations/review/partition/.readme.md
import { asReviewPartitionUnmatchedLines } from '@src/domain.operations/review/partition/asReviewPartitionUnmatchedLines';
import { getAllGlobsUnmatchedOfSplit } from '@src/domain.operations/review/partition/getAllGlobsUnmatchedOfSplit';
import type { ReviewPartitionSplit } from '@src/domain.operations/review/partition/getAllTargetsByPartition';
import { asCountedNoun } from '@src/utils/asCountedNoun';

import { asRouteGuardPartitionChangeLines } from './asRouteGuardPartitionChangeLines';
import { asRouteGuardPartitionPruneCommand } from './asRouteGuardPartitionPruneCommand';
import { asRouteGuardPartitionShellLines } from './asRouteGuardPartitionShellLines';
import { asRouteGuardPartitionSplitLabels } from './asRouteGuardPartitionSplitLabels';
import type { RouteGuardPartitionScope } from './RouteGuardPartitionScope';

/**
 * .what = the stdout tree of one `route.guard.partition` declaration — previewed or written
 * .why = a driver must see, before and after the write, which reviewers it reaches, what each
 *        partition claims of the branch, and what it replaced. the counts are the two the
 *        split turns on: what a partition alone holds (`narrow`) and what it shares (`common`)
 */
export const asRouteGuardPartitionTreeLines = (input: {
  mode: 'plan' | 'apply';
  route: string;
  scope: RouteGuardPartitionScope;
  /** the changed files the set was checked against */
  targets: string[];
  split: ReviewPartitionSplit;
  /** the estimated tokens of each changed file's body; null where none was read */
  tokensByPath: Map<string, number> | null;
  /** the partitions the scope held before; null where it held none */
  replaced: string[] | null;
  /**
   * the claims that grew the held set, each `glob → slug`; null for a whole declaration
   * .why = a claim writes the whole set back, but what the driver asked for is the claim — so
   *        the tree names each one, and says the rest of the set was kept
   */
  claimed: Array<{ glob: string; into: string }> | null;
  /**
   * the prunes that shrank the held set, each `glob ← slug`, or `wherever held` with no slug;
   * null for aught but a prune
   */
  pruned: Array<{ glob: string; from: string | null }> | null;
}): string[] => {
  // what each partition claims, in the row words the coverage read shares
  const labels = asRouteGuardPartitionSplitLabels({
    split: input.split,
    tokensByPath: input.tokensByPath,
  });
  // each row, with the globs it claims beneath it — so a driver reads what a partition holds
  // AND why, without a second read of the set
  const partitionLines = labels.partitions.flatMap((label, index, all) => {
    const isLast = index === all.length - 1;
    return [
      `   │  ${isLast ? '└─' : '├─'} ${label}`,
      `   │  ${isLast ? '   ' : '│  '}└─ ${labels.globs[index]}`,
    ];
  });

  // what the write replaced, or would — or, for a claim or prune, what it changed in the held set
  const replacedLines = asRouteGuardPartitionChangeLines({
    claimed: input.claimed,
    pruned: input.pruned,
    replaced: input.replaced,
  });

  // the globs that matched no changed file; once the set is written they are held, so the
  // branch closes on the one paste that drops them
  const unmatched = getAllGlobsUnmatchedOfSplit({
    split: input.split,
    route: input.route,
  });
  const cure =
    input.mode === 'apply' && unmatched.length > 0
      ? asRouteGuardPartitionPruneCommand({
          route: input.route,
          scope: input.scope,
          globs: unmatched.map((one) => one.glob),
        })
      : null;

  return asRouteGuardPartitionShellLines({
    mode: input.mode,
    route: input.route,
    scope: input.scope,
    headlineApplied: 'partitions declared',
    peerNote: '(overrides @all)',
    body: [
      `   ├─ checked against ${asCountedNoun({ count: input.targets.length, one: 'file', many: 'files' })} changed since main`,
      '   ├─ partitions',
      ...partitionLines,
      `   ├─ common: ${input.split.common.length}`,
      `   ├─ ${labels.unclaimed}`,
      ...asReviewPartitionUnmatchedLines({
        unmatched,
        indent: '   ',
        cure,
      }),
      ...replacedLines,
    ],
  });
};
