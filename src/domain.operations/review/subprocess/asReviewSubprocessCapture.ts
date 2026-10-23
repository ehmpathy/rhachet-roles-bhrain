import { asTimeoutHuman } from '@src/domain.operations/review/asTimeoutHuman';

/**
 * .what = the raw capture of a review subprocess — output + exit, timeout already folded in
 * .why = the single shape both capture tactics (buffered exec, streamed spawn) settle into, so the
 *        runner's tally + promotion logic runs identically regardless of how the child was run
 */
export interface ReviewSubprocessCapture {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * .what = folds a killed/coded subprocess result into the { stdout, stderr, exitCode } capture;
 *         a timeout-kill becomes the human-legible malfunction stderr
 * .why = one place owns the "killed → timeout message, else use the exit code" rule so the exec
 *        and spawn tactics cannot drift on how a timeout is reported (rule.forbid.failhide — a
 *        timeout must surface, never look like a clean exit)
 */
export const asReviewSubprocessCapture = (input: {
  stdout: string;
  stderr: string;
  code: number | null;
  killed: boolean;
  timeoutMs: number;
}): ReviewSubprocessCapture => {
  // a kill is a timeout, whatever the child wrote to stderr before it died
  if (input.killed)
    return {
      stdout: input.stdout,
      stderr: `💥 MalfunctionError: review timed out after ${asTimeoutHuman({ ms: input.timeoutMs })}`,
      exitCode: 1,
    };

  // else the child's own exit; an absent code is never a clean exit
  return {
    stdout: input.stdout,
    stderr: input.stderr,
    exitCode: input.code ?? 1,
  };
};
