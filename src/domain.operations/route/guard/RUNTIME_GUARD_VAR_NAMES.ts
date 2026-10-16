/**
 * .what = the canonical list of runtime variable names a guard command may carry
 * .why = these vars are substituted at RUN time (judge-run or review-run), not copy time,
 *   so they are meant to stay LITERAL in a materialized guard. one shared source keeps the
 *   judge/review substitution and the upgrade unknown-var scan in sync (no drift).
 *
 * .note = these are NAMES only. the name→value map lives in each consumer:
 *   - asCmdWithSubstitutedVars (runStoneGuardJudges) supplies the JUDGE-run values; a review-only var
 *     like $conversation or $targets is left LITERAL there (the judge has no review context)
 *   - runStoneGuardReviews supplies the REVIEW-run values (incl. $conversation, $targets)
 *   - getUnknownGuardVars (route.guard.upgrade) treats any $VAR outside this list as unknown
 */
export const RUNTIME_GUARD_VAR_NAMES = [
  '$route',
  '$stone',
  '$hash',
  '$output',
  '$rhx',
  '$rhachet',
  '$targets',
  '$conversation',
] as const;

export type RuntimeGuardVarName = (typeof RUNTIME_GUARD_VAR_NAMES)[number];

/**
 * .what = whether a token is one of the declared runtime var names
 * .why = a match of the shared pattern is a declared name today, but the compiler cannot
 *        see that. a check narrows it, so a widened pattern fails loud rather than looks
 *        up a key that is not there
 */
export const isRuntimeGuardVarName = (
  token: string,
): token is RuntimeGuardVarName =>
  (RUNTIME_GUARD_VAR_NAMES as readonly string[]).includes(token);
