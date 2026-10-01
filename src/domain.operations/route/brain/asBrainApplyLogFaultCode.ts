/**
 * .what = casts an unknown thrown value into the short fault code a brain APPLY trace carries
 *
 * .why = `setBrainApplyNote` is the one operation in this cluster that can neither rethrow a
 *        foreign fault nor write it to the log (the log is the target that failed), so it
 *        carries the fault OUT as a value instead. that value must be a plain, comparable
 *        string — a clamp asserts on it, and a caller that renders it must not embed an
 *        arbitrary object
 *
 * .note = it prefers node's `code` (`ENOSPC`, `EMFILE`, `EIO`) because that is the token an
 *         operator acts on, and falls back to the message only where no code is present
 */
export const asBrainApplyLogFaultCode = (error: unknown): string => {
  if (error && typeof error === 'object' && 'code' in error)
    return String((error as { code: unknown }).code);
  if (error instanceof Error) return error.message;
  return String(error);
};
