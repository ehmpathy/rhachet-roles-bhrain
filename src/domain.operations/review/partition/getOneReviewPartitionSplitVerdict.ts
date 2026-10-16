import { asReviewPartitionRefusal } from './asReviewPartitionRefusal';
import type { ReviewPartitionDeclared } from './asReviewPartitionsFromFlags';
import { asReviewPartitionWarnLines } from './asReviewPartitionWarnLines';
import { asTokensByPath } from './asTokensByPath';
import {
  getAllTargetsByPartition,
  type ReviewPartitionSplit,
} from './getAllTargetsByPartition';
import { getOneReviewPartitionCosts } from './getOneReviewPartitionCosts';
import { getOneTokensOfFiles } from './getOneTokensOfFiles';

/**
 * .what = splits a run's targets across its declared partitions, prices each partition,
 *         and derives the split's verdict — the refusal where it cannot hold, the warn
 *         lines where it holds with a caveat
 * .why = the split-vs-refuse-vs-warn rule has one home, and it is pure: the emit and the
 *        throw that act on the verdict live in `emitReviewPartitionSplitVerdict`, so this
 *        `get` keeps the side-effect-free promise its verb makes
 *        (rule.require.get-set-gen-verbs)
 *
 * .note = `null` where no partition is declared — there is no split to judge
 */
export const getOneReviewPartitionSplitVerdict = (input: {
  partitions: ReviewPartitionDeclared[];
  targets: string[];
  route: string | null;
  /** the whole set the split came from, so a coverage refusal proposes it repaired */
  repairVia: Parameters<typeof asReviewPartitionRefusal>[0]['repairVia'];
  /** each target's content, to price each partition by */
  targetContents: Array<{ path: string; content: string }>;
  /** the content every partition repeats — rules, refs, and conversation */
  headContents: Array<{ path: string; content: string }>;
  contextWindowTokens: number;
}): {
  split: ReviewPartitionSplit;
  costs: ReturnType<typeof getOneReviewPartitionCosts>;
  refusal: ReturnType<typeof asReviewPartitionRefusal>;
  warnLines: string[];
} | null => {
  // no declaration, no split
  if (input.partitions.length === 0) return null;

  // split the targets, then price each partition against the window
  const split = getAllTargetsByPartition({
    targets: input.targets,
    partitions: input.partitions,
    route: input.route,
  });
  const tokensByPath = asTokensByPath({ files: input.targetContents });
  const costs = getOneReviewPartitionCosts({
    split,
    tokensByPath,
    tokensOfHead: getOneTokensOfFiles({ files: input.headContents }),
    contextWindowTokens: input.contextWindowTokens,
  });

  // judge the split: a refusal where it cannot hold, warn lines where it holds with a caveat
  const refusal = asReviewPartitionRefusal({
    split,
    costs: costs.partitions,
    tokensByPath,
    route: input.route,
    repairVia: input.repairVia,
  });
  const warnLines = asReviewPartitionWarnLines({ split });
  return { split, costs, refusal, warnLines };
};
