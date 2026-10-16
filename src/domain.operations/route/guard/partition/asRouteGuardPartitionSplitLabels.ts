// sanctioned exposures, declared in src/domain.operations/review/partition/.readme.md
import { asReviewPartitionCountsLabel } from '@src/domain.operations/review/partition/asReviewPartitionCountsLabel';
import { asReviewPartitionUnclaimedLabel } from '@src/domain.operations/review/partition/asReviewPartitionUnclaimedLabel';
import type { ReviewPartitionSplit } from '@src/domain.operations/review/partition/getAllTargetsByPartition';

/**
 * .what = the estimated tokens of a set of paths, by the price of each
 * .why = a named sum, so a label reads "the mass of this partition" rather than a reduce to
 *        simulate (rule.forbid.inline-decode-friction)
 */
const getOneTokensOfPaths = (input: {
  paths: string[];
  tokensByPath: Map<string, number>;
}): number =>
  input.paths.reduce(
    (sum, path) => sum + (input.tokensByPath.get(path) ?? 0),
    0,
  );

/**
 * .what = the mass clause of one partition's label: its file bodies, and the share of them
 *         it holds in common
 * .why = 🔴 a set redeclared under a guard was blind to its own size: the read showed counts,
 *        and only a paid round showed whether a partition still overflowed alone. the bodies
 *        are the mass a driver's globs move, so the read shows them before arrival
 *
 * .note = a floor, never the prompt: each lane adds its rules, refs, conversation, and the
 *         diffs of edited files, and its window is its own brain's. the words say so
 */
const asMassClause = (input: {
  narrow: string[];
  common: string[];
  tokensByPath: Map<string, number>;
}): string => {
  const common = getOneTokensOfPaths({
    paths: input.common,
    tokensByPath: input.tokensByPath,
  });
  const total =
    common +
    getOneTokensOfPaths({
      paths: input.narrow,
      tokensByPath: input.tokensByPath,
    });
  return ` · ~${total.toLocaleString('en-US')} tokens of file bodies, ~${common.toLocaleString('en-US')} common`;
};

/**
 * .what = the row labels of a partition split: one per partition, and the unclaimed count
 * .why = the declaration tree and the coverage read both render these rows, each under its
 *        own branch and indent. the counts and the `unclaimed:` words are read from
 *        review/partition's one label each, so a reword lands in the route trees and the
 *        review's overflow split and plan at once (rule.forbid.duplicate-format-tree-operations)
 *
 * .note = labels only, never branch chars nor indent — each caller owns its tree shape
 * .note = with the price of each path, each label also carries its partition's mass; null
 *         where no price was read
 * .note = `globs` holds each partition's globs as declared, one comma-joined line per
 *         partition, so a tree can show beneath each row what that row claims
 */
export const asRouteGuardPartitionSplitLabels = (input: {
  split: ReviewPartitionSplit;
  tokensByPath: Map<string, number> | null;
}): { partitions: string[]; globs: string[]; unclaimed: string } => ({
  globs: input.split.partitions.map((partition) => partition.globs.join(', ')),
  partitions: input.split.partitions.map((partition) => {
    const tokensByPath = input.tokensByPath;
    const mass =
      tokensByPath === null
        ? ''
        : asMassClause({
            narrow: partition.narrow,
            common: partition.common,
            tokensByPath,
          });
    return `${asReviewPartitionCountsLabel({ partition })}${mass}`;
  }),
  unclaimed: asReviewPartitionUnclaimedLabel({ split: input.split }),
});
