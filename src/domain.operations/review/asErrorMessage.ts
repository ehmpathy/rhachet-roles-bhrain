/**
 * .what = the human text a caught throw carries, whatever was thrown
 * .why = a catch that renders its fault inline had to spell the type-guard out —
 *        `error instanceof Error ? error.message : error` — mid-sentence, so a
 *        reader simulated a branch to learn what text lands on the line
 *        (`rule.forbid.inline-decode-friction`)
 *
 * .note = it reads `message` off the SHAPE rather than off `instanceof Error`, for
 *         the realm reason `isErrorOfSpawnFailure` names: a native rejection can
 *         cross a vm boundary where `instanceof` answers false and the field survives
 */
export const asErrorMessage = (input: { error: unknown }): string => {
  if (
    typeof input.error === 'object' &&
    input.error !== null &&
    'message' in input.error &&
    typeof input.error.message === 'string'
  )
    return input.error.message;
  return String(input.error);
};
