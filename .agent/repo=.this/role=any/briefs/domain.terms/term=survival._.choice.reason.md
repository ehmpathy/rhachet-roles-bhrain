# domain.term.choice.reason: survival

## .etymology
`survival` names a one-time, boot-time check: probe the pid, wait a settle window, probe again
— survived only if alive at both. rejected `liveness`: that word is already claimed by
`getRouteReminderLiveness`, a distinct, REPEATED check made at daemon-detect time against an
already-established process. rejected `uptime` / `health`: both suggest a continued metric
tracked over the daemon's whole life, not a single pass/fail check made once, right after spawn.

## .disputes
none raised.

## .evidence
- discovery: `verifyRouteReminderBootSurvival` exists because a single instantaneous `kill -0`
  right after spawn cannot tell "booted, on its loop" from "still amid its own dynamic import,
  about to crash" — the settle window (`DEFAULT_ROUTE_REMINDER_BOOT_SETTLE_MS`) closes that gap.
- invariant: survival is checked exactly once per fresh spawn — a daemon that survives its boot
  is never re-checked by this path; later reads go through `liveness` instead.
