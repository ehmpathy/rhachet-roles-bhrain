import { exec, spawn } from 'child_process';
import { type IsoDuration, toMilliseconds } from 'iso-time';
import * as path from 'path';
import { promisify } from 'util';

import type { ContextReviewBrainSupply } from '../route/genReviewBrainSupply';
import { getDurationMsFromContent } from '../route/guard/getDurationMsFromContent';
import { getReviewCounts } from '../route/guard/review/getReviewCounts';
import {
  ReviewTallyError,
  ReviewTallyTimeoutError,
} from '../route/guard/review/getReviewCountsViaBrain';
import type { ReviewCountsResolved } from '../route/guard/review/getReviewCountsViaRegex';

const execAsync = promisify(exec);

/**
 * .what = path to the reviewer-output contract brief
 * .why = named once so the malfunction reason and its comment cannot drift if the brief moves
 */
const REVIEWER_OUTPUT_CONTRACT_BRIEF =
  '.agent/repo=bhrain/role=reviewer/briefs/contract.reviewer-output.md';

/**
 * .what = tells whether a caught tally fault is a timeout, by type — not a message match
 * .why = the sub-brain timeout is raised as a ReviewTallyTimeoutError, then wrapped by
 *        ReviewTallyError.wrap so it rides as a .cause. this walks that cause chain so the
 *        seam can pick a distinct user-visible message for a timeout vs a generic brain fault
 *        (the wish's distinct-messages ask) and NOT dump the raw wrapped message + metadata
 *        JSON into the artifact (rule.forbid.snapshot-visual-blemishes). the raw detail stays
 *        on the thrown error for logs; the human sees only the clean category reason.
 */
const isReviewTallyTimeout = (input: { error: unknown }): boolean => {
  // step down the cause chain (recursion, no mutable cursor); the timeout is wrapped as a
  // .cause of the outer tally error
  if (!(input.error instanceof Error)) return false;
  if (input.error instanceof ReviewTallyTimeoutError) return true;
  return isReviewTallyTimeout({ error: Reflect.get(input.error, 'cause') });
};

/**
 * .what = converts IsoDuration to milliseconds
 * .why = enables per-review timeout configuration
 * .note = override via RHACHET_REVIEW_TIMEOUT_MS env var for tests
 */
const getReviewTimeoutMs = (input: { timeout: IsoDuration }): number =>
  process.env.RHACHET_REVIEW_TIMEOUT_MS !== undefined
    ? parseInt(process.env.RHACHET_REVIEW_TIMEOUT_MS, 10)
    : toMilliseconds(input.timeout);

/**
 * .what = formats timeout for human-readable error message
 * .why = shows timeout in appropriate unit (seconds vs minutes)
 */
const formatTimeoutForHuman = (input: { ms: number }): string => {
  const seconds = Math.floor(input.ms / 1000);
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} minutes`;
};

/**
 * .what = the raw capture of a review subprocess — output + exit, timeout already folded in
 * .why = the single shape both capture tactics (buffered exec, streamed spawn) settle into, so the
 *        runner's tally + promotion logic runs identically regardless of how the child was run.
 */
interface ReviewSubprocessCapture {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * .what = folds a killed/coded subprocess result into the { stdout, stderr, exitCode } capture,
 *         rewriting a timeout-kill into the human-legible malfunction stderr
 * .why = one place owns the "killed → timeout message, else use the exit code" rule so the exec
 *        and spawn tactics cannot drift on how a timeout is reported (rule.forbid.failhide — a
 *        timeout must surface, never look like a clean exit).
 */
const asReviewSubprocessCapture = (input: {
  stdout: string;
  stderr: string;
  code: number | null;
  killed: boolean;
  timeoutMs: number;
}): ReviewSubprocessCapture => {
  if (input.killed)
    return {
      stdout: input.stdout,
      stderr: `💥 malfunction: review timed out after ${formatTimeoutForHuman({ ms: input.timeoutMs })}`,
      exitCode: 1,
    };
  return {
    stdout: input.stdout,
    stderr: input.stderr,
    exitCode: input.code ?? 1,
  };
};

/**
 * .what = runs the review cmd via buffered exec — the default capture tactic (guard + aggregate)
 * .why = byte-identical to the runner's original inline exec, so the guard's committed snapshots
 *        stay stable. no live output: the child's stdout is captured whole and returned at once.
 */
const captureReviewViaExec = async (input: {
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
    // exec rejects a non-zero/killed run with an ExecException holding stdout/stderr/code/killed;
    // any other error type is an unexpected fault (spawn ENOENT, a bug) → rethrow (rule.forbid.failhide)
    if (
      !error ||
      typeof error !== 'object' ||
      !('stdout' in error || 'stderr' in error || 'code' in error)
    )
      throw error;
    // .cast = @types/node does not export ExecException as a narrowable type; the `in` guard proves
    //         the shape and each field is re-checked below (rule.forbid.as-cast — external boundary).
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
 * .what = runs the review cmd via spawn, teeing each stdout chunk live to `onStdoutChunk` while
 *         accumulating the full capture — the streaming capture tactic (human `--for`)
 * .why = a human running `review.by --for` should see the child review stream progressively, the
 *        SAME live output a direct `rhx review` gives, instead of a silent wait then a dump
 *        (rule.require.status-feedback). the accumulated stdout is byte-identical to the exec
 *        capture, so the settled stamp + guard-parseable summary are unchanged — only the delivery
 *        differs (chunks live, vs whole at end). spawn's own `timeout` kills a hung child; a killed
 *        run folds into the same timeout malfunction as the exec path.
 */
const captureReviewViaSpawn = async (input: {
  cmd: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
  timeoutMs: number;
  onStdoutChunk: (chunk: string) => void;
}): Promise<ReviewSubprocessCapture> => {
  return new Promise<ReviewSubprocessCapture>((takeCapture, rejectFault) => {
    const child = spawn(input.cmd, {
      cwd: input.cwd,
      env: input.env,
      shell: true,
      timeout: input.timeoutMs,
      killSignal: 'SIGTERM',
    });

    // .note = deliberate mutation. stdout/stderr accumulate across many 'data' events; an
    //         imperative accumulator is the clearest shape for streamed capture
    //         (rule.require.immutable-vars — annotated-mutation exception).
    let stdout = '';
    let stderr = '';

    // tee each stdout chunk live to the human AND accumulate it for the settled stamp
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
};

/**
 * .what = the resolved outcome of one review subprocess run
 * .why = the single shape both the route guard and review.by fold into their own wrappers.
 *        carries the post-promotion exitCode/stderr, the tally, and enough to rebuild a
 *        verdict — so neither caller re-implements exec, capture, tally, or the failhide-safe
 *        malfunction promotion.
 */
export interface ReviewRun {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number | null;
  blockers: number;
  nitpicks: number;
  tallier: 'deterministic' | 'probabilistic' | null;
  detected: boolean;
}

/**
 * .what = the shared review runner — execs one review command as a subprocess, captures its
 *         output, tallies blockers/nitpicks, and promotes a no-verdict exit-0 to malfunction
 * .why = the route guard and review.by both need EXACTLY this sequence. one shared runner, one
 *        execution path — no in-process fork that would drift from the subprocess path over time.
 *        callers differ only in how they build the cmd string and what they wrap the result into.
 */
export const runOneReview = async (
  input: {
    cmd: string;
    timeout: IsoDuration;
    cwd: string;
  },
  context: ContextReviewBrainSupply & {
    // .why = optional live-stream tee. when present, the child review runs via spawn and each
    //        stdout chunk is forwarded here as it arrives, so a human `--for` run streams the
    //        review progressively instead of a silent wait (rule.require.status-feedback). absent
    //        for the guard + aggregate paths, which capture whole via buffered exec. a context
    //        callback, not an input field — exempt from rule.forbid.undefined-inputs.
    onStdoutChunk?: (chunk: string) => void;
  },
): Promise<ReviewRun> => {
  // execute command with node_modules/.bin in PATH
  // .why = enables callers to use `rhx` or `rhachet` directly without npx
  const nodeModulesBin = path.join(input.cwd, 'node_modules', '.bin');
  const baseEnv = {
    ...process.env,
    PATH: `${nodeModulesBin}${path.delimiter}${process.env.PATH ?? ''}`,
  };

  // the child review gates its own live progress spinner on RHACHET_GUARD_CONTEXT: set, the child
  // runs SILENT and emits only its settled output at the very end; unset, the child streams its
  // spinner progressively — to STDOUT (see stepReview withSpinner) — exactly like a direct
  // `rhx review`. so the env differs by capture tactic:
  // - buffered (guard + aggregate): SET it. the caller renders its own progress and wants a clean,
  //   deterministic capture with no spinner frames. byte-identical to before.
  // - streamed (a human `--for` run): UNSET it. the whole point is a progressive live stream, so the
  //   child MUST emit its spinner; leaving guard context on would silence it and the human would see
  //   nothing until the end. genReviewBodyStreamer tees the child's stdout (banner-stripped) live.
  const execEnv = context.onStdoutChunk
    ? baseEnv
    : { ...baseEnv, RHACHET_GUARD_CONTEXT: '1' };

  // compute timeout in milliseconds
  const timeoutMs = getReviewTimeoutMs({ timeout: input.timeout });

  // capture the review subprocess. two tactics settle into one ReviewSubprocessCapture:
  // - streamed spawn when the caller passes onStdoutChunk (a human `--for` run) — the child review
  //   streams progressively as it writes (rule.require.status-feedback)
  // - buffered exec otherwise (guard + aggregate) — byte-identical to the original inline exec, so
  //   the guard's committed snapshots stay stable
  // both yield the SAME accumulated stdout, so the tally + settled stamp are unaffected by tactic.
  const capture = context.onStdoutChunk
    ? await captureReviewViaSpawn({
        cmd: input.cmd,
        cwd: input.cwd,
        env: execEnv,
        timeoutMs,
        onStdoutChunk: context.onStdoutChunk,
      })
    : await captureReviewViaExec({
        cmd: input.cmd,
        cwd: input.cwd,
        env: execEnv,
        timeoutMs,
      });

  const stdout = capture.stdout;
  // .note = deliberate mutation. stderr/exitCode are reassigned by the malfunction promotion
  //         below; an imperative accumulator is the clearest shape there
  //         (rule.require.immutable-vars — annotated-mutation exception).
  let stderr = capture.stderr;
  let exitCode = capture.exitCode;

  // derive blockers/nitpicks via the cascade: deterministic regex first, then a cheap
  // sub-brain fallback when an exit-0 review stated its verdict in prose (not numbers).
  // .note = the cascade may THROW on a brain fault/timeout. catch it HERE (the per-review
  //         seam) and convert to a malfunction: the run blocks loud, and the human sees a
  //         brain-error reason distinct from the no-verdict reason.
  //         this is NOT a failhide — a brain crash becomes a malfunction, never a silent pass.
  const { counts, brainErrorReason } = await (async (): Promise<{
    counts: ReviewCountsResolved;
    brainErrorReason: string | null;
  }> => {
    try {
      return {
        counts: await getReviewCounts({ content: stdout, exitCode }, context),
        brainErrorReason: null,
      };
    } catch (error) {
      // allowlist: ONLY a deliberate brain-tally fault (ReviewTallyError — the build, ask, or
      // timeout of the sub-brain tactic) becomes a per-review malfunction. an unexpected code
      // defect is NOT ours to swallow — rethrow it so it fails loud (rule.forbid.failhide).
      if (!(error instanceof ReviewTallyError)) throw error;
      // clean, category-distinct reason — a timeout reads apart from a generic fault, and NEITHER
      // leaks the internal wrapper message / metadata JSON into the artifact (the raw detail lives
      // on the thrown error for logs). see rule.forbid.snapshot-visual-blemishes.
      return {
        counts: { detected: false },
        brainErrorReason: isReviewTallyTimeout({ error })
          ? '💥 malfunction: review tally fallback timed out ' +
            '(the sub-brain that tallies a prose review did not respond in time). ' +
            `see ${REVIEWER_OUTPUT_CONTRACT_BRIEF}`
          : '💥 malfunction: review tally fallback failed ' +
            '(the sub-brain that tallies a prose review could not be reached). ' +
            `see ${REVIEWER_OUTPUT_CONTRACT_BRIEF}`,
      };
    }
  })();
  const blockers = counts.detected ? counts.blockers : 0;
  const nitpicks = counts.detected ? counts.nitpicks : 0;
  // internal→contract boundary: the orchestrator's chosen `tactic` becomes the public `tallier`
  // (named for the role that produced the tally).
  const tallier = counts.detected ? counts.tactic : null;

  // promote a "successful" review to malfunction when it yields no trustworthy verdict
  // .why = a review that exits 0 but declares no numeric blocker/nitpick count — and whose
  //        prose the sub-brain also could not tally — cannot be trusted as "approved": the
  //        caller cannot see its verdict. a silent 0/0 would look like a clean review when in
  //        truth no review was read. failfast as a malfunction. see rule.forbid.failhide.
  //        the brain-error reason (if any) takes precedence so the human can tell a brain
  //        fault apart from an odd-wording miss. contract: REVIEWER_OUTPUT_CONTRACT_BRIEF
  if (exitCode === 0 && !counts.detected) {
    exitCode = 1;
    const reason =
      brainErrorReason ??
      '💥 malfunction: reviewer output lacks a numeric blocker/nitpick count ' +
        '(expected `N blockers` and `N nitpicks`; use `0 blockers` / `0 nitpicks` to declare clean). ' +
        `see ${REVIEWER_OUTPUT_CONTRACT_BRIEF}`;
    stderr = [stderr, reason].filter((line) => line !== '').join('\n');
  }

  // parse duration from stdout via shared operation
  const durationMs = getDurationMsFromContent({ content: stdout });

  return {
    stdout,
    stderr,
    exitCode,
    durationMs,
    blockers,
    nitpicks,
    tallier,
    detected: counts.detected,
  };
};
