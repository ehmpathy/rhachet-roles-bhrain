import type { ReviewPartitionSplit } from './getAllTargetsByPartition';

/**
 * .what = the share of the window a partition prompt may fill before it refuses
 * .why = the same bound the whole-run compile refuses at (`compileReviewPrompt`), so a plan
 *        that says ✓ agrees with the run that follows
 */
const SHARE_OF_WINDOW_ALLOWED = 0.75;

/**
 * .what = a count of files and the tokens they weigh
 */
export interface ReviewPartitionMass {
  files: number;
  tokens: number;
}

/**
 * .what = what one partition prompt will carry, by reuse breadth
 */
export interface ReviewPartitionCost {
  name: string;
  narrow: ReviewPartitionMass;
  common: ReviewPartitionMass;
  /** narrow + common + the head every prompt carries (rules, refs, conversation) */
  total: ReviewPartitionMass & {
    fits: boolean;
    /** the most tokens one partition prompt may carry — the mark a narrower cut must reach */
    limit: number;
  };
}

/**
 * .what = sums the tokens of a set of paths
 */
const getOneMassOfPaths = (input: {
  paths: string[];
  tokensByPath: Map<string, number>;
}): ReviewPartitionMass => ({
  files: input.paths.length,
  tokens: input.paths.reduce(
    (sum, path) => sum + (input.tokensByPath.get(path) ?? 0),
    0,
  ),
});

/**
 * .what = what each partition of a split will carry, and whether it fits the window
 * .why = the plan render shows it, and a partition that cannot fit refuses BEFORE any brain
 *        is called, rather than one partition deep in a pour (seed S44)
 *
 * .note = an estimate from the same per-file token counts the breakdown reports. the run
 *         itself compiles each prompt and still refuses an overflow it finds, so the estimate
 *         gates early and never stands alone
 */
export const getOneReviewPartitionCosts = (input: {
  split: ReviewPartitionSplit;
  tokensByPath: Map<string, number>;
  /** the tokens every prompt carries apart from its targets — rules, refs, conversation */
  tokensOfHead: number;
  contextWindowTokens: number;
}): { common: ReviewPartitionMass; partitions: ReviewPartitionCost[] } => {
  const limit = input.contextWindowTokens * SHARE_OF_WINDOW_ALLOWED;
  return {
    common: getOneMassOfPaths({
      paths: input.split.common,
      tokensByPath: input.tokensByPath,
    }),
    partitions: input.split.partitions.map((partition) => {
      const narrow = getOneMassOfPaths({
        paths: partition.narrow,
        tokensByPath: input.tokensByPath,
      });
      const common = getOneMassOfPaths({
        paths: partition.common,
        tokensByPath: input.tokensByPath,
      });
      const tokens = narrow.tokens + common.tokens + input.tokensOfHead;
      return {
        name: partition.name,
        narrow,
        common,
        total: {
          files: narrow.files + common.files,
          tokens,
          fits: tokens <= limit,
          limit,
        },
      };
    }),
  };
};
