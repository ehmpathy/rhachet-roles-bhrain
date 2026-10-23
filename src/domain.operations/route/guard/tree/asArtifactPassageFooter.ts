import { asExitCodeClass } from '../asExitCodeClass';

/**
 * .what = the passage footer of one guard artifact, read off its exit code alone
 * .why = the exit class decides both the reason and the glyph — ✋ for a constraint the
 *        caller must fix, 💥 for a malfunction the system must (rule.require.qualified-error-headers).
 *        one named map keeps the two from a drift apart, and keeps the decode out of the runner
 *
 * .note = a zero exit owes no passage footer, so it maps to null
 */
export const asArtifactPassageFooter = (input: {
  exitCode: number;
}): null | { blockReason: string; exitCode: number; exitEmoji: string } => {
  // a clean exit blocks naught
  if (input.exitCode === 0) return null;

  // a constraint is the caller's to fix; every other nonzero exit is a malfunction
  const isConstraint =
    asExitCodeClass({ code: input.exitCode }) === 'constraint';
  return {
    blockReason: isConstraint
      ? 'blocked by constraints'
      : 'blocked by malfunction',
    exitCode: input.exitCode,
    exitEmoji: isConstraint ? '✋' : '💥',
  };
};
