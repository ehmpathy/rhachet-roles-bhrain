import { asNodeErrnoCode } from '../asNodeErrnoCode';
import {
  DEFAULT_REMINDER_JITTER_RATIO,
  getRouteReminderJitteredMs,
} from './getRouteReminderJitteredMs';
import { setRouteReminderCrashLog } from './setRouteReminderCrashLog';
import type { RouteReminderExitReason } from './stepRouteReminderTick';
import { stepRouteReminderTick } from './stepRouteReminderTick';
import { TOLERATED_IO_WRITE_ERRNOS } from './TOLERATED_IO_WRITE_ERRNOS';

/**
 * .what = the RouteReminder daemon loop — tick, sleep, repeat, until a tick says exit
 * .why = this is the daemon's OWN behavior, the part the vision keeps in scope: a wall-clock
 *        loop that wakes every interval, runs one tick, and tears itself down the moment a
 *        tick returns `exit` (a dead route or a dead session). the loop holds U3's
 *        no-infiniloop guarantee — it cannot outlive its purpose, because every cycle re-reads
 *        the exit decision from disk.
 *
 * .note = `stepRouteReminderTick` is a same-repo domain op, so it is IMPORTED and composed
 *         directly, never injected (rule.forbid.inject-same-repo-domain-ops — to inject our own
 *         domain code buys no test seam and widens the context contract). only the genuine
 *         external boundaries are injected: `sayToClone` (the `rhx clone say` process boundary,
 *         handed through to the tick), `sleep` (the wall-clock timer), and `random` (the jitter
 *         source, defaulted to Math.random). a fake sayToClone + fake sleep over a real
 *         passage.jsonl, with `random` pinned, proves the loop deterministically.
 *
 * .note = each sleep is JITTERED ±10% (vision Q2, via getRouteReminderJitteredMs) so a fleet of
 *         daemons that register together does not tick in lockstep. `random` is injected so a test
 *         pins it to 0.5 (offset 0 → exact interval).
 */
export const runRouteReminderDaemon = async (
  input: {
    route: string;
    cloneAddr: string;
    intervalMs: number;
    sayTimeoutMs: number;
  },
  context: {
    sayToClone: (input: {
      addr: string;
      what: string;
      timeoutMs?: number;
    }) => Promise<{ reached: true } | { reached: false; reason: string }>;
    sleep: (ms: number) => Promise<void>;
    random?: () => number;
  },
): Promise<{
  exitReason: RouteReminderExitReason;
  ticks: number;
}> => {
  // deliberate mutation: a loop counter is the one scoped mutable in this daemon loop.
  // it proves (with a fake sayToClone/sleep over a real passage) that the loop ran N cycles and
  // exited with no sleep after the last tick (rule.require.immutable-vars scoped-mutation exemption).
  let ticks = 0;

  // wake each interval; a tick either nudges (loop on) or exits (loop ends)
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const outcome = await stepRouteReminderTick(
      {
        route: input.route,
        cloneAddr: input.cloneAddr,
        sayTimeoutMs: input.sayTimeoutMs,
      },
      { sayToClone: context.sayToClone },
    );
    ticks += 1;

    // a dead route or dead session ends the loop — the daemon tears itself down
    if (outcome.action === 'exit') {
      // a failed reach (session-dead) is the ONE exit the wisher requires be OBSERVABLE, not silent:
      // record a durable malfunction crash log so a transient-blip false-positive leaves a
      // discoverable trace (vision U3 idle-stall decision, settled 2026-09-06). the benign route-end
      // doors (route-not-live / route-complete) are clean exits, not malfunctions — no crash log there.
      //
      // the crash-log write is a SECONDARY observability aid; the PRIMARY observability is the
      // exit-reason RETURN (which routeReminderDaemon prints to the redirected daemon log). so an
      // EXPECTED io fault in the aux write (no space / read-only / denied dir on `.malfunctions/`)
      // must NOT propagate and defeat the clean self-exit — that would turn a by-design teardown into
      // a raw crash and SUPPRESS the very exit-reason line this seam exists to surface. so we
      // ALLOWLIST the expected io errnos: surface them LOUD to stderr (never hidden —
      // rule.forbid.failhide) and still return the reason. an errno OUTSIDE the allowlist, or a
      // non-errno throw (a real bug in the writer), is NOT a tolerated io fault — it RETHROWS, so a
      // genuine defect never hides behind this observability aid (rule.forbid.failhide).
      if (outcome.reason === 'session-dead')
        await setRouteReminderCrashLog({
          route: input.route,
          cloneAddr: input.cloneAddr,
          reason: outcome.reason,
          ticks,
        }).catch((crashLogError: unknown) => {
          const errno = asNodeErrnoCode(crashLogError);
          if (errno === undefined || !TOLERATED_IO_WRITE_ERRNOS.includes(errno))
            throw crashLogError;
          // eslint-disable-next-line no-console
          console.error(
            `route.reminder.daemon crash-log write failed (${errno}; exit still clean): reason=${outcome.reason} route=${input.route} clone=${input.cloneAddr}`,
            crashLogError,
          );
        });
      return { exitReason: outcome.reason, ticks };
    }

    // the nudge landed; sleep a jittered interval, then wake for the next tick
    await context.sleep(
      getRouteReminderJitteredMs({
        intervalMs: input.intervalMs,
        ratio: DEFAULT_REMINDER_JITTER_RATIO,
        random: context.random ?? Math.random,
      }),
    );
  }
};
