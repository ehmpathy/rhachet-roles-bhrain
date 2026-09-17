/**
 * .what = reads the human-legible summary out of a caught, unknown-typed throw
 *
 * .why  = a `catch (error)` binds `unknown`, so every call site that wants the
 *         root fault in its message must re-derive the same narrow. done inline
 *         it is decode-friction at exactly the moment a reader is mid-debug
 *         (`rule.forbid.inline-decode-friction`), and done inconsistently it
 *         yields `[object Object]` for a non-Error throw
 *
 * 🔴 .why the cause belongs in the MESSAGE and not only in `cause:` metadata =
 *     the cli renders an error's message as the line a human reads, and appends
 *     its metadata as a raw json blob below. a fault named only in metadata is
 *     technically present and practically unread — so `ENOENT` and `EACCES`
 *     arrive as the same sentence, which is the defect raised i032/r6 + r10
 *
 * .note = both are owed, never one. the message carries the cause so a human
 *         reads it; `cause:` carries the original so the stack trace survives
 *
 * .note = the narrow is the one `src/contract/cli/route.ts` already performs in
 *         `asStatusLineFaultGuidance`. it is not lifted from there because that
 *         one is a private const inside a contract file with a different job —
 *         this is the leaf both shapes want, and the other is a fair candidate
 *         to route through it on contact
 */
export const asErrorCauseClause = (input: {
  /** the value a `catch` bound — an Error, or whatever else a throw can carry */
  error: unknown;
}): string => {
  // the overwhelmingly common case, and the only one that carries an fs code
  if (input.error instanceof Error) return input.error.message;

  // ⚠️ a plain object stringifies to `[object Object]`, which names no fault at
  //    all. json is lossy for a cyclic value, so it falls back rather than throws
  //    — a cause clause must never itself become the failure
  if (typeof input.error === 'object' && input.error !== null) {
    try {
      return JSON.stringify(input.error);
    } catch {
      return String(input.error);
    }
  }

  return String(input.error);
};
