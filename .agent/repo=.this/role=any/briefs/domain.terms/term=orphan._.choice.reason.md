# domain.term.choice.reason: orphan

## .etymology
`orphan` is the standard unix word for a child process whose parent no longer tracks it — here
sharpened to mean a daemon the auto-wire lost its OWN handle to, so it cannot be found and
deregistered. rejected `zombie` (a distinct unix term of art — a process that exited but whose
exit status was never reaped by `wait()`; the RouteReminder daemon is still alive on its loop,
not exited). rejected `leaked` / `stray`: both read as generic resource-management prose, not a
named, dedicated fault type a guard can discriminate on by class.

## .disputes
none raised.

## .evidence
- discovery: `RouteReminderOrphanError` is a DEDICATED error subclass, not a reuse of the base
  `UnexpectedCodePathError` — so the auto-wire's fault guard can discriminate this ONE
  un-proceedable case (a loose, unreapable process) from the reminder's benign faults (a
  malformed pid handle, a torn passage line), which must surface loud yet let the drive proceed.
- invariant: an orphan is the one RouteReminder fault the auto-wire (`stepRouteDrive`) must NOT
  swallow — it fails loud and a human must act, per `rule.forbid.behavior-hazards`.
