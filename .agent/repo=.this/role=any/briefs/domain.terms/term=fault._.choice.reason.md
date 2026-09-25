# domain.term.choice.reason: fault

## .etymology
`fault` names a failure the daemon's own tick loop anticipates and classifies — a say-timeout,
a non-zero process exit — as opposed to `error`, the generic base class every throw in the
codebase already uses (`ConstraintError`, `MalfunctionError`). a dedicated word was needed so a
reader could tell "the daemon caught and classified this" from "any error, anywhere". `crash`
was rejected for this concept because a crash is the process's own unplanned death (read from
outside via `isProcessAlive`); a fault is read from inside a tick still active on the loop.

## .disputes
none raised.

## .evidence
- discovery: `asRouteReminderProcessFaultError` and `asRouteReminderSayFaultMessage` both
  transform a raw failure (a timeout, a non-zero exit code) into a domain-named shape the
  circuit-breaker (`bumpRouteReminderCrashBreaker`) and the log (`setRouteReminderCrashLog`)
  consume — the pipeline needed one word for "the failure kind", separate from `crash` (the
  process-death kind the breaker counts).
- invariant: a fault is always surfaced (never swallowed) via `surfaceRouteReminderFault`, per
  `rule.forbid.behavior-hazards` — the reminder's own failure must not silently propagate into
  the drive it exists to support.
