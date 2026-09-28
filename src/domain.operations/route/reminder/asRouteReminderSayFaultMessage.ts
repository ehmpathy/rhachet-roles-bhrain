/**
 * .what = the human-faced headline for a genuine `rhx clone say` fault (a non-exit-2 failure)
 * .why = when the inject boundary fails for a real reason — rhx absent, a wedged timeout, an
 *        unexpected exit — the thrown error must name the concrete fault AND the remedy, not a
 *        bare "failed unexpectedly" (rule.require.errors-name-the-fix). this pure transformer
 *        derives that headline from the fault shape, so the message a human reads is
 *        deterministic and snapshot-testable, decoupled from the live execFile boundary.
 *
 * .note = exit 2 (ConstraintError, no LIVE clone) is NOT a fault — it is the expected
 *         dead-session signal handled in sayToClone before this is ever called. this transformer
 *         only names the genuine-fault path.
 */
export const asRouteReminderSayFaultMessage = (input: {
  code: number | string | null;
  killed: boolean;
  timeoutMs: number;
}): string => {
  // ENOENT = the rhx binary is not on PATH
  if (input.code === 'ENOENT')
    return 'rhx clone say failed: rhx not found on PATH — install rhx or fix PATH';

  // a killed child (execFile timeout) reports the signal, not an exit code
  if (input.killed || input.code === null)
    return `rhx clone say timed out after ${input.timeoutMs}ms — the clone or rhx is wedged`;

  // otherwise, an unexpected non-2 exit code from a reachable rhx
  return `rhx clone say failed unexpectedly (exit ${String(input.code)}) — see stderr`;
};
