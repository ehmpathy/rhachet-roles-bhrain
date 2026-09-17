/**
 * .what = narrows a caught, unknown-typed throw to what `cause:` accepts
 *
 * .why  = `HelpfulError`'s `cause` is typed `Error | undefined`, and a `catch`
 *         binds `unknown`. so every site that wants the stack trace preserved
 *         must narrow, and the narrow inline is a ternary a reader decodes at
 *         the exact moment they are mid-repair
 *
 * .note = it is the METADATA half of a pair. `asErrorCauseClause` is the
 *         message half, and both are owed on a wrap: the clause carries the
 *         fault to the human who reads the cli line, this carries the original
 *         so the stack trace survives the rewrite
 *
 * ⚠️ .why a non-Error yields `undefined` rather than a synthesized Error =
 *     a manufactured stack trace points at THIS file, never at the throw, so it
 *     would misroute the very diagnosis `cause:` exists to serve. the fault
 *     itself is not lost — `asErrorCauseClause` already put it in the message
 */
export const asErrorCause = (input: {
  /** the value a `catch` bound */
  error: unknown;
}): Error | undefined =>
  input.error instanceof Error ? input.error : undefined;
