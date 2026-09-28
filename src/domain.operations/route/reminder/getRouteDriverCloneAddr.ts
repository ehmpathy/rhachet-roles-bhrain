/**
 * .what = reads the current driver session's own clone address from its spawn env, in the
 *         canonical `@:<serial>` form
 * .why = the auto-wire (stepRouteDrive findserts the reminder) needs the driver's OWN clone
 *        address to hand the daemon, so the daemon's `rhx clone say <addr>` targets THIS
 *        session. the rhachet enroller injects `RHACHET_CLONE_SERIAL` into every clone it
 *        spawns (the clone's primary ref) as a BARE serial — but every RouteReminder surface
 *        that carries a cloneAddr (a `--clone-addr` flag, a pid-path key, the daemon's own
 *        injection call) speaks the ONE `@:`-prefixed form, so the sigil is added here, at the
 *        single read, rather than left for each downstream consumer to remember.
 *        `rx clone whoami` reads the same bare-serial env var, then prints it prefixed for a
 *        human too (its `you are @:...` line). because stepRouteDrive runs as a hook INSIDE
 *        the driver clone, it reads that var directly from `process.env` — no subprocess, no
 *        `clone whoami` round-trip.
 *
 * .note = returns null when the var is ABSENT — that is the "not an enrolled clone" signal,
 *         not a fault. a plain `claude` session (a human at a terminal, no enroller) has no
 *         serial, so it has no reminder to wire; the caller skips the reminder gracefully
 *         (rule.forbid.failhide — an absent optional is returned, never swallowed as an error).
 *
 * .note = the env-var NAME is rhachet's contract (its enroller writes it, its `clone say`
 *         addresses the serial it holds), consumed here verbatim — cited, not itemized. the
 *         `@:` sigil is likewise rhachet's own address form (asCloneRef); prepend it here.
 */
export const getRouteDriverCloneAddr = (): { cloneAddr: string } | null => {
  const serial = process.env.RHACHET_CLONE_SERIAL;

  // absent or empty = not spawned by the enroller = a plain session with no clone to nudge
  if (!serial || serial.trim().length === 0) return null;

  return { cloneAddr: `@:${serial}` };
};
