# domain.term.choice.reason: reminder

## .etymology
`reminder` = that which reminds — recalls an actor to an intent it already holds. the driver
already means to drive on; the outage or hesitancy makes it idle. the injected prose does not
COMMAND a new action — it RECALLS the driver to the drive it was already on. that is exactly a
reminder, not an order.

the word is the **wisher's own coinage**, stated outright in the wish:

> "we should call this concept a 'Reminder' btw. e.g., a 'RouteReminder' … that we schedule"

so the term is settled by the domain expert, not invented at the keyboard. chosen over the
mechanism words a nearby engineer would reach for — `daemon`, `cron`, `heartbeat`, `poke` — each
of which names HOW it runs, not WHY it exists. a `heartbeat` proves liveness; a `reminder`
recalls intent. they are different concepts; the wish wants the latter.

## .disputes
### dispute: tick / RouteTick  —  raised 2026-08-29 (vision)  —  status: RESOLVED (keep `reminder`, as-wished)
- raised.by  = the vision's payload-fork analysis (Q1)
- claim      = if the injected payload were a DETERMINISTIC command (e.g. `rhx route.drive`), the
               concept would not be a "reminder" at all — it would be a scheduled dispatch, whose
               truer name is `tick` / `RouteTick`. so the word depends on the payload.
- counter    = the wish supplies a PROSE payload ("you can do it! drive on, fulcrum, and
               converge") and names it "Reminder". prose recalls intent → reminder is correct
               as-wished. the deterministic-command fork is a *contingency* gated on the
               nudge-efficacy must-validate (U1), not an open choice now. `tick` survives only as
               the name of ONE wall-clock cycle (`stepRouteReminderTick`), a sub-part of the
               reminder, never the whole concept.
- resolution = keep `reminder` for the concept; record `tick` as a forbidden synonym FOR THE
               CONCEPT (it remains legal for the single-cycle sub-part). if the payload ever
               becomes a deterministic command, re-open this dispute — the word would shift to a
               dispatch/tick term.

## .evidence
- discovery: the wish's day-in-the-life narrative (a driver idles post-outage; the scheduled
  prose recalls it to the drive) — a scenario-timeline discovery, distilled in
  `.behavior/v2026_08_07.driver-cron/1.vision.yield.md` (usecases U1/U4/U5).
- the concept's attributes/lifecycle: register (findsert) → detect → deregister (self-exit),
  keyed per-session by route + cloneAddr; live only while the drive is an active self-drivable
  state (isReminderLiveForPassageStatus).
- forbidden-combination invariant: a reminder must NOT fire at a dead/parked route or a dead
  session — the daemon self-exits instead (the wish's "no ifniloops" hard requirement).
