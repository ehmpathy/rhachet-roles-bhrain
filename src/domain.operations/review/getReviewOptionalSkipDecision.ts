import { enumFilesForReviewSupplies } from '@src/domain.operations/review/enumFilesForReviewSupplies';

/**
 * .what = the single trigger predicate for an `--optional` rules skip: rules is flagged
 *         optional AND its glob was effective (non-empty) yet matched zero files
 * .why = one owner for "which supply skips on empty" so the literal `'rules'` + emptiness rule
 *        is not duplicated across `review.ts` and `stepReview` (which would drift when `refs`
 *        lands). pure, so both the CLI pre-check (which enumerates first, via
 *        getReviewOptionalSkipDecision) and stepReview (which already holds its rule files) call
 *        the same rule. callers validate `--optional` names against the shared allow-list
 *        upstream, so by here `optional` holds only supported names.
 */
export const isReviewRulesSkip = (input: {
  ruleGlobs: string[];
  ruleFiles: string[];
  optional: string[] | undefined;
}): boolean =>
  input.ruleGlobs.length > 0 &&
  input.ruleFiles.length === 0 &&
  (input.optional ?? []).includes('rules');

/**
 * .what = decides whether an `--optional` rules skip applies, and returns the normalized rules
 *         globs (walked once) so the caller can emit the skip without a second glob walk
 * .why = the CLI (`review.ts`) has no rule files yet when it must decide the skip BEFORE brain
 *        discovery, so it enumerates here and defers the rule to `isReviewRulesSkip`. keeps the
 *        skip trigger in one place while the CLI pays a single glob walk.
 */
export const getReviewOptionalSkipDecision = async (input: {
  rules: string | string[];
  optional: string[] | undefined;
  cwd: string;
}): Promise<{ skip: boolean; ruleGlobs: string[] }> => {
  const ruleGlobs = Array.isArray(input.rules)
    ? input.rules
    : [input.rules].filter(Boolean);

  // short-circuit before the glob walk when rules is not flagged optional or has no glob to test
  if (!(input.optional ?? []).includes('rules') || ruleGlobs.length === 0)
    return { skip: false, ruleGlobs };

  const ruleFiles = await enumFilesForReviewSupplies({
    glob: ruleGlobs,
    cwd: input.cwd,
  });
  return {
    skip: isReviewRulesSkip({ ruleGlobs, ruleFiles, optional: input.optional }),
    ruleGlobs,
  };
};
