import type { ReviewScopeSettled } from './getOneReviewScopeSettled';
import type { StepReviewInput } from './StepReviewInput';

/**
 * .what = the four scope figures an overflow refusal prints — rules, diffs, paths, the join
 * .why = each figure is picked from a different source (the flags, the settled scope, the
 *        two token breakdowns, the joined targets). behind a name, the orchestrator reads
 *        "refuse with the scope figures" rather than a 20-line literal a reader must map back
 *        to its sources (rule.forbid.decode-friction-in-orchestrators)
 */
export const asReviewOverflowScopeFigures = (input: {
  review: Pick<StepReviewInput, 'rules' | 'diffs'>;
  scope: ReviewScopeSettled['scope'];
  ruleFiles: string[];
  targetFiles: string[];
  tokens: { rules: number; targets: number };
}): {
  rules: { flag: string | string[] | undefined; files: number; tokens: number };
  diffs: { flag: string | undefined; files: number };
  paths: { with: string[]; wout: string[]; files: number };
  joined: { mode: string; files: number; tokens: number };
} => ({
  rules: {
    flag: input.review.rules,
    files: input.ruleFiles.length,
    tokens: input.tokens.rules,
  },
  diffs: {
    flag: input.review.diffs,
    files: input.scope.targets.fromDiffs.length,
  },
  paths: {
    with: input.scope.paths.with,
    wout: input.scope.paths.wout,
    files: input.scope.targets.fromPaths.length,
  },
  joined: {
    mode: input.scope.join,
    files: input.targetFiles.length,
    tokens: input.tokens.targets,
  },
});
