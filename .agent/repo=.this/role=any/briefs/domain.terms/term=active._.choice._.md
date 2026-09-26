# domain.term: active

term.chosen   = active
term.kind     = adj
term.synonyms.forbidden:
- alive
- advanceable
- awake
- afoot
- open

## .what

a route drive is **active** ⟺ it is a self-advanceable drive the RouteReminder should still nudge:
its latest passage status is live-for-reminder AND the drive is NOT complete. this is the single
composite predicate behind "should the reminder fire?" — read by `getRouteReminderDriveActivity`,
which returns `{ active: true }` or `{ active: false, reason }` (the reason names WHICH door closed:
`route-not-live` or `route-complete`).

**active is NOT a synonym of `live`.** the two are a deliberate two-tier pair, not one concept:

- **live** (`isReminderLiveForPassageStatus` / `getRouteReminderLiveness`) = the STATUS tier: the
  latest passage status permits a nudge (not `blocked` / `rewound` / `exhausted` / `malfunction`).
- **active** (`getRouteReminderDriveActivity`) = the FULL predicate: `live` AND not complete. a
  terminal `passed` reads LIVE by status alone (indistinct from a mid-route pause), so the stone
  frontier (`getRouteDriveComplete`) is the completion discriminator `live` structurally cannot see.

so every active drive is live, but not every live drive is active (a completed drive is live-by-status
yet inactive). the three RouteReminder call-sites all read `active`, never `live` directly, so they
can never disagree on "is the route still a live drive": the auto-wire findserts iff active, the
daemon tick self-exits iff inactive, the manual cli reports honest liveness iff active.

## .refs

where the term composes declared operations:
- src/domain.operations/route/reminder/getRouteReminderDriveActivity.ts   # the predicate — {active, reason}
- src/domain.operations/route/reminder/syncRouteReminderForDrive.ts       # findserts iff active
- src/domain.operations/route/reminder/stepRouteReminderTick.ts           # self-exits iff inactive
- src/contract/cli/route.reminder.ts                                      # routeReminderGen reports honest liveness iff active

## .reason

see the ref-level cluster beside this choice:
- `term=active._.choice.reason.md` — etymology, the live-vs-active two-tier distinction, evidence
