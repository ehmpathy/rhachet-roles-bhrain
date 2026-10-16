import { exec as execRaw, spawn as spawnRaw } from 'child_process';
import { promisify } from 'util';

import {
  asReviewSubprocessCapture,
  type ReviewSubprocessCapture,
} from './asReviewSubprocessCapture';

const execAsync = promisify(execRaw);

/**
 * .what = runs the review cmd via buffered exec — the default capture tactic (guard + aggregate)
 * .why = byte-identical to the runner's original inline exec, so the guard's committed snapshots
 *        stay stable. no live output: the child's stdout is captured whole and returned at once
 */
const exec = async (input: {
  cmd: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
  timeoutMs: number;
}): Promise<ReviewSubprocessCapture> => {
  try {
    const result = await execAsync(input.cmd, {
      cwd: input.cwd,
      env: input.env,
      timeout: input.timeoutMs,
    });
    return { stdout: result.stdout, stderr: result.stderr, exitCode: 0 };
  } catch (error: unknown) {
    // exec rejects a non-zero/killed run with an ExecException that carries stdout/stderr/code/killed;
    // any other error type is an unexpected fault (spawn ENOENT, a bug) → rethrow (rule.forbid.failhide)
    if (
      !error ||
      typeof error !== 'object' ||
      !('stdout' in error || 'stderr' in error || 'code' in error)
    )
      throw error;
    // .cast = @types/node does not export ExecException as a narrowable type; the `in` guard proves
    //         the shape and each field is re-checked below (rule.forbid.as-cast — external boundary)
    const errObj = error as Record<string, unknown>;
    return asReviewSubprocessCapture({
      stdout: typeof errObj.stdout === 'string' ? errObj.stdout : '',
      stderr: typeof errObj.stderr === 'string' ? errObj.stderr : '',
      code: typeof errObj.code === 'number' ? errObj.code : null,
      killed: errObj.killed === true,
      timeoutMs: input.timeoutMs,
    });
  }
};

/**
 * .what = runs the review cmd via spawn; each stdout chunk is teed live to `onStdoutChunk` and
 *         also kept for the full capture — the streamed capture tactic (human `--for`)
 * .why = a human who runs `review.by --for` should see the child review stream progressively, the
 *        SAME live output a direct `rhx review` gives, instead of a silent wait then a dump
 *        (rule.require.status-feedback). the kept stdout is byte-identical to the exec capture,
 *        so the settled stamp + guard-parseable summary are unchanged — only the delivery
 *        differs. spawn's own `timeout` kills a hung child; a killed run folds into the same
 *        timeout malfunction as the exec path
 */
const spawn = async (input: {
  cmd: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
  timeoutMs: number;
  onStdoutChunk: (chunk: string) => void;
}): Promise<ReviewSubprocessCapture> =>
  new Promise<ReviewSubprocessCapture>((takeCapture, rejectFault) => {
    const child = spawnRaw(input.cmd, {
      cwd: input.cwd,
      env: input.env,
      shell: true,
      timeout: input.timeoutMs,
      killSignal: 'SIGTERM',
    });

    // .note = deliberate mutation. stdout/stderr build up across many 'data' events; an
    //         imperative accumulator is the clearest shape for streamed capture
    //         (rule.require.immutable-vars — annotated-mutation exception)
    let stdout = '';
    let stderr = '';

    // tee each stdout chunk live to the human AND keep it for the settled stamp
    child.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stdout += text;
      input.onStdoutChunk(text);
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    // a spawn-level fault (ENOENT, bad shell) is an unexpected defect → reject so it fails loud
    child.on('error', rejectFault);

    // 'close' fires once stdio is drained; a timeout kill arrives as a non-null signal
    child.on('close', (code, signal) => {
      takeCapture(
        asReviewSubprocessCapture({
          stdout,
          stderr,
          code,
          killed: signal !== null,
          timeoutMs: input.timeoutMs,
        }),
      );
    });
  });

/**
 * .what = the review subprocess communicator — its two capture tactics
 * .why = the raw child-process boundary, apart from the runner that tallies and promotes, so the
 *        two tactics — the boundary likeliest to drift from each other — get an integration test
 *        of their own rather than only through the whole runner
 */
export const sdkReviewSubprocess = { exec, spawn };
