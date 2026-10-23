/**
 * .what = true when a caught brain call fault is a reply cut off at the model's output
 *         limit (`finish_reason=length`)
 * .why = on a model that thinks before it answers, that cutoff is a think that never
 *        ended: the reply holds no content at all, every output token went to the think.
 *        it is a sampled event, not a property of the prompt — the same lane on the same
 *        prompt completes on other asks — so one more ask may well converge, where a
 *        re-arrive costs the whole round
 *
 * .note = it reads `metadata.finishReason` by shape, never by class: the fault arrives from
 *         the brain package, which may load its own copy of `helpful-errors`
 */
export const isErrorOfReplyCutAtOutputLimit = (input: {
  error: unknown;
}): boolean => {
  // only an object can carry metadata
  if (typeof input.error !== 'object' || input.error === null) return false;
  // .note = the `as` reads a field NAME off a caught value already proven an object above;
  //         the field is typed `unknown`, so the checks below are the gate
  const { metadata } = input.error as { metadata?: unknown };
  if (typeof metadata !== 'object' || metadata === null) return false;

  // a reply that ended at the output limit says so in its finish reason
  // .note = the `as` reads the field NAME off a metadata value already proven an object above;
  //         the field is typed `unknown`, so the strict compare below is the gate
  const { finishReason } = metadata as { finishReason?: unknown };
  return finishReason === 'length';
};
