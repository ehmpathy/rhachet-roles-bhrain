# domain.term.choice.reason: daemon

## .etymology
`daemon` is the standard unix term for a long-lived, detached background process (httpd, sshd,
cron). the RouteReminder mechanism is exactly this shape — a `spawn(..., { detached: true,
stdio: 'ignore' }).unref()` process outside the driver's own turn loop. we adopt the term
because it is what any unix-literate reader already expects: no explanation needed.

rejected `worker`: implies a task-queue consumer (a job pulled off a queue), not a self-tick
loop with its own wall-clock cadence. rejected `background-job` / `service`: both imply a
managed, registered process (systemd unit, job scheduler entry); the RouteReminder daemon is
unmanaged — its own pid file is its only registration, and it tends its own death.

## .disputes
none raised.

## .evidence
- discovery: the wish itself asked for a mechanism to "overcome intermittent api outages" via a
  scheduled nudge; the vision (`1.vision.yield.md`) settled on an external, self-exit daemon
  after it excluded claude-code's in-session cron (session-scoped, not shell-controllable) and
  durable cron (feature-gated off in the installed binary).
- invariant: exactly one daemon per (route, session) pair — keyed by
  `getRouteReminderPidPath({ route, cloneAddr })` — findserted, never duplicated.
