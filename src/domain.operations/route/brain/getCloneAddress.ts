import { spawn } from 'child_process';

import { asCloneAddress } from './asCloneAddress';
import type { StoneBrainHaltCause } from './StoneBrainHaltCause';
import { setBrainApplyNote } from './setBrainApplyNote';

/**
 * .what = the cap on the `clone whoami` await, in milliseconds
 * .why = the probe runs inside a driver hook capped at 25s (`.claude/settings.json`); an
 *        unbounded await on a child that never closes would burn the whole cap, and the halt
 *        would read as a slow hook rather than name its fix (case=2)
 *
 * .note = 10s. measured on rhachet 1.47.6: p50 = 5537ms, p95 ≈ 6500ms; a 2s cap timed out
 *         every healthy probe
 * .note = exported so `getCloneAddress.integration.test.ts [case8]` can clamp it against the
 *         smallest `route.drive` hook timeout read off disk — a prose claim about a foreign
 *         file rots in silence
 */
export const WHOAMI_TIMEOUT_MS = 10_000;

/**
 * .what = the sentinel a failed `JSON.parse` returns, so its failure is a VALUE
 * .why = a parsed document may legitimately be `null`, `false`, or `0`, so no in-band value can
 *        mean "did not parse"; a unique symbol narrows on identity (`rule.forbid.failhide`)
 */
const PARSE_FAILED = Symbol('parse.failed');

/**
 * .what = the clone address a probe confirmed, or the reason none was
 * .why = unenrolled is the common case, so it is an answer, never an exception
 *
 * .note = a discriminated union: a null address cannot travel without a cause, so every halt
 *         names its fix (`rule.prefer.prevent-over-correct`)
 */
export type CloneAddressRead =
  | { address: string; cause?: undefined }
  | { address: null; cause: StoneBrainHaltCause };

/**
 * .what = reads this clone's own address, or the reason none was confirmed
 * .why = a driver launched directly has no clone address, so the caller must confirm one
 *        BEFORE it addresses any say
 *
 * .note = the exit code parts the causes (`rule.require.exit-code-semantics`): `clone whoami`
 *         exits 2 outside an enrolled clone (the caller's to fix), non-zero otherwise when broken
 * .note = which payload field becomes the address is `asCloneAddress`'s to state; this owns the
 *         spawn, the exit code, and the cap
 * .note = `reachState` is not gated on: this repo does not own that vocabulary
 */
export const getCloneAddress = async (input: {
  rhx: string;
  repoRoot: string;
}): Promise<CloneAddressRead> => {
  /**
   * .what = appends one diagnostic line to the brain-apply log
   * .why = the cause names the CLASS of fault (rendered to the driver, a closed vocabulary);
   *        the log names the INSTANCE (ENOENT vs EACCES, the raw payload) for a debugger
   *
   * .note = `setBrainApplyNote` cannot throw, which matters here: both call sites are
   *         `EventEmitter` handlers, and a throw would skip `settle(...)` and hang the await.
   *         its `{ noted, fault }` is discarded — a handler has no channel to carry it
   */
  const noteCause = (text: string): void => {
    void setBrainApplyNote({
      repoRoot: input.repoRoot,
      text: `getCloneAddress: ${text}`,
    });
  };

  return new Promise((settle) => {
    const child = spawn(input.rhx, ['clone', 'whoami', '--output', 'json'], {
      cwd: input.repoRoot,
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    // release the hook's event loop from this child
    // .why = the cap bounds the AWAIT, not the CHILD; a wedged child left ref'd keeps the hook
    //        alive past the cap, and `kill()` is a request the child may ignore
    child.unref();

    // bound the await, and report the CAP rather than a diagnosis it did not make
    // .note = `timed-out`, never `unreadable-clone`: the timer settles first, so a late
    //         `code === 2` (unenrolled, the common case) is discarded. a cap knows one fact
    // .note = the timer is REF'D while the child is not. with both unref'd, a child that shut
    //         its stdout and lingered left zero handles, the loop drained, and this promise
    //         never settled (`rule.forbid.failhide`)
    const timer = setTimeout(() => {
      child.kill();
      settle({ address: null, cause: 'timed-out' });
    }, WHOAMI_TIMEOUT_MS);

    const chunks: string[] = [];
    child.stdout.on('data', (chunk) => {
      chunks.push(String(chunk));
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      // the cause names the class; the log names the instance (ENOENT vs EACCES)
      noteCause(
        `\`clone whoami\` spawn failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      settle({ address: null, cause: 'unreadable-clone' });
    });

    child.on('close', (code) => {
      clearTimeout(timer);

      // exit 2 = a constraint the caller owns: this process is not an enrolled clone
      if (code === 2) return settle({ address: null, cause: 'unenrolled' });

      // a signal kill (`code === null`) is a liveness event, never a malfunction
      // .note = must precede the catch-all below. the cap's own `kill()` settles first with
      //         `timed-out`, so only an EXTERNAL kill reaches here
      if (code === null) return settle({ address: null, cause: 'killed' });

      // any other non-zero exit = the instrument itself broke
      if (code !== 0)
        return settle({ address: null, cause: 'unreadable-clone' });

      // exit 0: parse alone, so a non-document (`unreadable-payload`) stays apart from a
      // document with no address (`unreadable-address`) — opposite diagnoses
      const payload = ((): unknown | typeof PARSE_FAILED => {
        try {
          return JSON.parse(chunks.join(''));
        } catch (error) {
          // log the SyntaxError and the raw emission; a re-run by hand may not reproduce them
          noteCause(
            `\`clone whoami\` emitted an unreadable payload: ${
              error instanceof Error ? error.message : String(error)
            } — raw: ${JSON.stringify(chunks.join(''))}`,
          );
          return PARSE_FAILED;
        }
      })();
      if (payload === PARSE_FAILED)
        return settle({ address: null, cause: 'unreadable-payload' });

      const address = asCloneAddress({ payload });
      if (!address)
        return settle({ address: null, cause: 'unreadable-address' });
      return settle({ address });
    });
  });
};
