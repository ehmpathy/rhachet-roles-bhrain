import { execFile } from 'child_process';
import { UnexpectedCodePathError } from 'helpful-errors';
import { getGitRepoRoot } from 'rhachet-artifact-git';
import { promisify } from 'util';

import { asRouteReminderSayFaultMessage } from './asRouteReminderSayFaultMessage';
import { DEFAULT_REMINDER_SAY_TIMEOUT_MS } from './DEFAULT_REMINDER_SAY_TIMEOUT_MS';

const execFileAsync = promisify(execFile);

/**
 * .what = dispatches a message into a driver clone via `rhx clone say` — the injection hop
 * .why = this is the daemon's one boundary to the outside world: it writes the nudge into the
 *        driver session's pty input "with no keyboard". it is also the U3 dead-session probe —
 *        `rhx clone say` is reach-state gated, so a clone that is not LIVE fails loud, and that
 *        failure IS the dead-session signal the tick reads to self-exit. one call, two jobs.
 *
 * the exit-code contract of `rhx clone say`:
 * - exit 0 → the message reached a LIVE clone            → `{ reached: true }`
 * - exit 2 → ConstraintError, no LIVE clone at that addr → `{ reached: false }` (dead session)
 * - other  → a genuine fault (rhx absent, timeout, malfunction) → throw (fail-fast)
 *
 * .note = an UNreachable clone is an EXPECTED result, not a swallowed error — it is returned as
 *         `{ reached: false }` (rule.forbid.failhide). only exit 2 (the reach-state gate) is
 *         classified this way; every other non-zero exit propagates as a MalfunctionError.
 *
 * .note = `input.addr` already carries the `@:` sigil — every RouteReminder caller holds the
 *         address in that one canonical form (asRouteReminderCloneAddr / getRouteDriverCloneAddr),
 *         so this boundary passes it straight through with no re-prefix. a re-prefix here would
 *         re-open the exact bare-vs-prefixed split the canonical form exists to close: a caller
 *         one layer up could then hand either shape and both would happen to work, which is the
 *         synonym path this repo forbids (rule.forbid.domain-term-synonyms). the argv is EXACTLY
 *         the vision's documented command — `rhx clone say <addr> --what "..."`, no extra flags.
 *         an undocumented flag would be a silent feature-killer: if the installed rhx rejected it,
 *         every live call would exit non-zero (a genuine-fault throw, or a mis-classified exit 2 →
 *         false self-exit on every live route). so the command is held to the exact form the
 *         vision proved, and the reached:false door below is tested against that exact form (a
 *         bogus address, real binary).
 *
 * .note = the reached:true path needs a real enrolled LIVE clone — that is the vision's
 *         must-validate spike. the reached:false path is proven for real (exit 2 against a
 *         bogus address) in the integration test.
 */
export const sayToClone = async (input: {
  addr: string;
  what: string;
  timeoutMs?: number;
}): Promise<{ reached: true } | { reached: false; reason: string }> => {
  // the wall-clock bound on this `rhx clone say` call. a hung inject must NOT wedge the daemon tick
  // forever — without a bound, a stuck call (a network stall, a jammed pty) would block the tick
  // indefinitely, so the loop never reaches its next cycle to read a `blocked` route, which would
  // defeat the U3 self-exit guarantee. the timeout converts a wedge into a loud fault (execFile kills
  // the child, the call rejects), which the catch treats as the "other exit → throw" fault path. the
  // default is 30s (generous for a call that answers in ms); an operator on a slow machine widens it
  // via the threaded --say-timeout-ms, so a merely-slow-but-alive call is not read as a dead session.
  const timeoutMs = input.timeoutMs ?? DEFAULT_REMINDER_SAY_TIMEOUT_MS;

  // run `rhx` from the git root so its `.agent/` skill resolution is predictable — a subprocess
  // must never inherit a cwd outside the git root (rule.forbid.cwd-outside-gitroot).
  const cwd = await getGitRepoRoot({ from: process.cwd() });

  try {
    // exit 0 → the clone was LIVE and received the message. argv = the vision's exact command.
    // input.addr already carries the `@:` sigil — no re-prefix (see the .note above).
    await execFileAsync(
      'rhx',
      ['clone', 'say', input.addr, '--what', input.what],
      { timeout: timeoutMs, cwd },
    );
    return { reached: true };
  } catch (error: unknown) {
    // external boundary: execFile rejects with a node ExecException — an untyped `unknown`
    // that carries { code, stdout, stderr } at runtime. one documented boundary cast reads
    // those props (rule.forbid.as-cast external-boundary exemption).
    const err = error as {
      code?: number | string | null;
      killed?: boolean;
      stdout?: string;
      stderr?: string;
    };
    const code = err.code;
    const killed = err.killed ?? false;
    const stdout = err.stdout ?? '';
    const stderr = err.stderr ?? '';

    // exit 2 = ConstraintError: no LIVE clone answers → the dead-session door. name the addr and
    // the concrete state so a human/operator reads an actionable reason, not a bare "unreachable"
    // (rule.require.errors-name-the-fix). rhx's own stderr/stdout (if any) rides along verbatim
    // for the specific cause — no JSON.parse, no blanket catch: the addr is always named, and any
    // detail rhx emits is appended as-is.
    if (code === 2) {
      const detail = [stderr.trim(), stdout.trim()].find((s) => s.length > 0);
      const reason = detail
        ? `clone ${input.addr} not reachable — ${detail}`
        : `clone ${input.addr} not reachable (no LIVE clone at that address — not enrolled, or already exited)`;
      return { reached: false, reason };
    }

    // any other exit is a genuine fault → fail loud with a message that names the concrete
    // fault + remedy (rule.require.errors-name-the-fix), never read as "session dead"
    throw new UnexpectedCodePathError(
      asRouteReminderSayFaultMessage({
        code: code ?? null,
        killed,
        timeoutMs,
      }),
      { addr: input.addr, code, killed, stdout, stderr },
    );
  }
};
