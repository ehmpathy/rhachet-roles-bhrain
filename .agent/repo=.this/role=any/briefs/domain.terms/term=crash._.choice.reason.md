# domain.term.choice.reason: crash

## .etymology
`crash` is the plain-english word for a process that dies without a clean exit — it reads
correctly with zero gloss. it is deliberately kept distinct from `fault` (see `term=fault`): a
crash is read from OUTSIDE the process (`isProcessAlive` returns false where it once returned
true), a fault is caught from INSIDE a tick that is still alive and able to classify its own
failure. the two words let a reader tell "the process itself died" from "the process is alive
but a step inside it failed" without a re-read of the code.

## .disputes
none raised.

## .evidence
- discovery: `verifyRouteReminderBootSurvival` names the "crash-on-arrival" case explicitly — a
  daemon that reads alive at `t0` then dies before its boot-settle window ends. `setRouteReminderCrashLog`
  persists the crash's reason + session + tick-count so a silent first-fail self-exit still
  leaves a durable trace (per the wisher's U3 acceptance: "an observability addition").
- invariant: every crash bumps the `breaker` (`term=breaker`); a crash is never counted twice for
  the same daemon instance (the breaker bump is keyed to the daemon's own exit, not polled).
