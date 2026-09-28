import { asNodeErrnoCode } from './asNodeErrnoCode';

/**
 * .what = runs an fs operation and tolerates ONLY an absent-path fault — resolves `null` on ENOENT,
 *         rethrows every other error.
 * .why = "read a path, treat absent as the empty case" is the single most-copied idiom in the route
 *        fs boundary — the same 4-line `.catch(e => asNodeErrnoCode(e) === 'ENOENT' ? default : throw)`
 *        appeared independently across ~8 reminder + passage leaves. one audited combinator collapses
 *        them to a single place, so the ENOENT-vs-real-fault line cannot drift copy-to-copy (e.g. one
 *        copy quietly grows to also tolerate EISDIR while the others stay strict) — the exact drift
 *        class the crash-breaker read-modify-write defect showed (rule.prefer.most-common-denominator,
 *        rule.forbid.failhide — absent is the ONLY tolerated fault, all else surfaces).
 *
 * .note = the caller coalesces `null` into its own empty case (`?? []`, `?? { count: 0 }`, a no-op for
 *         a del), so this stays a pure absent-path combinator with no per-caller default baked in. lives
 *         in route/ (beside asNodeErrnoCode) — the common ancestor of its reminder/ and passage/ callers.
 */
export const withEnoentAsNull = async <T>(
  operation: () => Promise<T>,
): Promise<T | null> => {
  return operation().catch((error: unknown) => {
    // an absent path (ENOENT) is the tolerated empty case → null. every other fault is real and surfaces.
    if (asNodeErrnoCode(error) === 'ENOENT') return null;
    throw error;
  });
};
