/**
 * .what = the canonical list of runtime variable names a guard command may carry
 * .why = these vars are substituted at RUN time (judge-run or review-run), not copy time,
 *   so they are meant to stay LITERAL in a materialized guard. one shared source keeps the
 *   judge/review substitution and the upgrade unknown-var scan in sync (no drift).
 *
 * .note = these are NAMES only. the name→value map lives in each consumer:
 *   - substituteVars (runStoneGuardJudges) supplies the JUDGE-run values; a review-only var
 *     like $conversation is left LITERAL there (the judge has no conversation context)
 *   - runStoneGuardReviews supplies the REVIEW-run values (incl. $conversation)
 *   - getUnknownGuardVars (route.guard.upgrade) treats any $VAR outside this list as unknown
 */
export const RUNTIME_GUARD_VAR_NAMES = [
  '$route',
  '$stone',
  '$hash',
  '$output',
  '$rhx',
  '$rhachet',
  '$conversation',
] as const;

export type RuntimeGuardVarName = (typeof RUNTIME_GUARD_VAR_NAMES)[number];
