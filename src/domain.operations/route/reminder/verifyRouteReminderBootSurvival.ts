import { isProcessAlive } from './isProcessAlive';

// a real detached daemon needs real time to boot — reach past its dynamic import, read passage.jsonl,
// arrive at its loop — before it can crash. the settle window must outlast that boot so a
// crash-on-arrival is caught by the SECOND probe. 250ms is a conservative cold-boot budget for a
// node child plus a subpath dynamic import.
export const DEFAULT_ROUTE_REMINDER_BOOT_SETTLE_MS = 250;

const sleepMs = (ms: number): Promise<void> =>
  new Promise((done) => setTimeout(done, ms));

/**
 * .what = verifies a freshly-spawned RouteReminder daemon SURVIVES its boot — alive across a short
 *         settle window, not merely alive microseconds after fork.
 * .why = a single instantaneous `kill -0` right after spawn cannot tell "booted, in its loop" from
 *        "still amid its dynamic import, about to crash". a crash-on-arrival child (a broken subpath,
 *        a bad node binary, an OOM mid-boot) reads ALIVE at t0 and dies a moment later — so an
 *        instantaneous probe reports alive:true for a doomed daemon, a handle is written that goes
 *        stale in milliseconds, and the next drive hook reads it absent and re-spawns → a SILENT,
 *        unbounded spawn-storm on every turn boundary, at exactly the outage the reminder exists to
 *        rescue (rule.forbid.behavior-hazards). this probes, waits a boot-settle window, and probes
 *        again: SURVIVED only if alive at BOTH, so a crash-on-arrival is surfaced (the findsert's
 *        `created && !alive` branch fires and logs) instead of a silent re-spawn.
 *
 * .note = the settle window is a real wall-clock wait, so it costs latency ONCE per fresh spawn — the
 *         findsert returns a live handle on later drives with no re-verify. `settleMs` is a caller knob
 *         so a test pins a short, deterministic window against a real short-lived child (no mock of the
 *         process boundary; rule.forbid.inject-same-repo-domain-ops keeps `isProcessAlive` imported),
 *         and a known-slow host can widen it.
 *
 * .note = this window is a HEURISTIC, not a proven bound — no finite wait can prove a process will
 *         never crash later (a slow host could reach past 250ms in its import, then throw). that is
 *         acceptable because the no-infiniloop guarantee does NOT rest on this check. it rests on two
 *         other invariants: (a) the daemon's OWN per-tick self-exit — a dead route or dead session
 *         ends the loop from disk state, no probe needed; and (b) the route.drive hook cadence — a
 *         re-spawn happens at most ONCE per turn boundary (onBoot/onStop), never in a tight loop. so a
 *         crash that lands AFTER the window costs at most one wasted process per turn, not an unbounded
 *         storm. the crash-breaker this check feeds is a SECONDARY optimization for the rapid-fire
 *         case, and the DOMINANT crash-on-arrival (a broken subpath, a bad node binary) dies inside its
 *         import, well under 250ms, so it IS caught. the narrow tail — a host that reliably boots past
 *         the window then crashes on every spawn — is closed by the vision's A5 refinement (poll to a
 *         real daemon boot-completion signal, e.g. a booted-marker the loop writes), tracked as
 *         [research], not shipped here.
 */
export const verifyRouteReminderBootSurvival = async (input: {
  pid: number;
  settleMs: number;
}): Promise<{ survived: boolean }> => {
  // an instant-dead pid crashed before it even booted — no need to wait the settle window
  if (!isProcessAlive({ pid: input.pid })) return { survived: false };

  // let the boot settle, then re-probe: a crash-on-arrival dies within this window
  await sleepMs(input.settleMs);
  return { survived: isProcessAlive({ pid: input.pid }) };
};
