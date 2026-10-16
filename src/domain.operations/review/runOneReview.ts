import type { IsoDuration } from 'iso-time';
import * as path from 'path';

import { asDurationMsFromContent } from '@src/domain.operations/asDurationMsFromContent';
// the one reach across a subdomain: brain/ is a declared shared subdomain (its .readme.md)
import type { ContextReviewBrainSupply } from '@src/domain.operations/brain/genReviewBrainSupply';
import { ENV_OF_PROGRESS_SILENT } from '@src/domain.operations/isProgressSilenced';
import { ENV_OF_REVIEW_SUBPROCESS } from '@src/domain.operations/isReviewSubprocess';
import { asReviewMalfunctionPromotion } from '@src/domain.operations/review/asReviewMalfunctionPromotion';
import { ENV_OF_REVIEW_BRAIN_CALL_TIMEOUT_MS } from '@src/domain.operations/review/getOneReviewBrainCallTimeoutMsFromEnv';
import { getOneReviewBrainCallTimeoutMsFromSubprocess } from '@src/domain.operations/review/getOneReviewBrainCallTimeoutMsFromSubprocess';
import { getOneReviewTallyOutcome } from '@src/domain.operations/review/getOneReviewTallyOutcome';
import { asEnvWithReviewPrimeMeet } from '@src/domain.operations/review/prime/asEnvWithReviewPrimeMeet';
import { getOneReviewSubprocessTimeoutMs } from '@src/domain.operations/review/subprocess/getOneReviewSubprocessTimeoutMs';
import { sdkReviewSubprocess } from '@src/domain.operations/review/subprocess/sdkReviewSubprocess';

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
  /**
   * the PINNED brain that tallied — null where no sub-brain did. named by pin, never
   * `latest`, which would go false the day the pin moves; every caller renders this one
   */
  talliedBy: string | null;
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
    /**
     * whether this child pours beside peers that share its prompt prefix
     *
     * only the caller that poured knows: the guard passes `join` for a level pour of
     * two or more lanes, and every other caller passes `skip`. a review child alone is
     * no evidence of peers, so this is never derived from the subprocess marker
     */
    meet: 'join' | 'skip';
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
  // bound the subprocess, and hand the brain call inside it a bound strictly below,
  // so the child's clean ReviewTimeoutError fires before the parent's kill
  // .note = the derived bound rides an internal var, never the human's
  //         RHACHET_REVIEW_TIMEOUT_MS — so the human's var holds what the human set at
  //         every depth, and only the child's brain-call bound reads the derived value
  const timeoutMs = getOneReviewSubprocessTimeoutMs({ timeout: input.timeout });
  const brainCallTimeoutMs = getOneReviewBrainCallTimeoutMsFromSubprocess({
    subprocessMs: timeoutMs,
  });
  // .note = three markers, three facts. the subprocess marker rides EVERY tactic, so a hook
  //         in a session the child spawns can always tell it is not the driver's. the
  //         progress marker rides the buffered tactic alone, for the reason above. the
  //         prime-meet marker rides only where the caller poured this child with peers,
  //         and is stripped otherwise, so a parent's own marker never leaks down
  const execEnv = {
    ...asEnvWithReviewPrimeMeet({
      env: context.onStdoutChunk
        ? baseEnv
        : { ...baseEnv, [ENV_OF_PROGRESS_SILENT]: '1' },
      meet: input.meet,
    }),
    [ENV_OF_REVIEW_SUBPROCESS]: '1',
    [ENV_OF_REVIEW_BRAIN_CALL_TIMEOUT_MS]: String(brainCallTimeoutMs),
  };

  // capture the review subprocess. two tactics settle into one ReviewSubprocessCapture:
  // - streamed spawn when the caller passes onStdoutChunk (a human `--for` run) — the child review
  //   streams progressively as it writes (rule.require.status-feedback)
  // - buffered exec otherwise (guard + aggregate) — byte-identical to the original inline exec, so
  //   the guard's committed snapshots stay stable
  // both yield the SAME accumulated stdout, so the tally + settled stamp are unaffected by tactic.
  const capture = context.onStdoutChunk
    ? await sdkReviewSubprocess.spawn({
        cmd: input.cmd,
        cwd: input.cwd,
        env: execEnv,
        timeoutMs,
        onStdoutChunk: context.onStdoutChunk,
      })
    : await sdkReviewSubprocess.exec({
        cmd: input.cmd,
        cwd: input.cwd,
        env: execEnv,
        timeoutMs,
      });

  const stdout = capture.stdout;

  // derive blockers/nitpicks via the cascade: deterministic regex first, then a cheap
  // sub-brain fallback; a sub-brain fault becomes a reason, never a silent pass
  const { counts, brainErrorReason } = await getOneReviewTallyOutcome(
    { stdout, exitCode: capture.exitCode },
    context,
  );
  // an UNDETECTED count reads as 0 here, so a broken lane drains no round. the passage
  // gate (`asPeerGivenVerdict`) reads the same case as 1 blocker, so no clean bill is
  // minted from an unread verdict. both answer NO; do not unify them — a 1 here would
  // charge a round for a review that never ran
  const blockers = counts.detected ? counts.blockers : 0;
  const nitpicks = counts.detected ? counts.nitpicks : 0;
  // the tallier that produced the tally — one word, from the tally contract to the artifact
  const tallier = counts.detected ? counts.tallier : null;

  // the model that tallied, as named by the brain that answered — read once here so the
  // guard footer, the guard tree, and review.by all name the same model
  const talliedBy = counts.detected ? counts.talliedBy : null;

  // promote an exit-0 run with no readable verdict to malfunction (rule.forbid.failhide)
  const { exitCode, stderr } = asReviewMalfunctionPromotion({
    exitCode: capture.exitCode,
    stderr: capture.stderr,
    detected: counts.detected,
    brainErrorReason,
  });

  // parse duration from stdout via shared operation
  const durationMs = asDurationMsFromContent({ content: stdout });

  return {
    stdout,
    stderr,
    exitCode,
    durationMs,
    blockers,
    nitpicks,
    tallier,
    talliedBy,
    detected: counts.detected,
  };
};
