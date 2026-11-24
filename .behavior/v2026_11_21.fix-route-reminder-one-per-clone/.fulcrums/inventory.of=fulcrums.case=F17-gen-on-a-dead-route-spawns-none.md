# F17 — gen on a dead route spawns none

## .the fork

when a human runs `rhx route.reminder.gen` on a route that is not a live drive (blocked, rewound, complete), the verb either:

- **A.** spawns a daemon as before, which then exits `route-not-live` on its first tick
- **B.** spawns none, names the halt and its status, and keeps a live daemon's focus where it is

## .taken

**B.** a daemon spawned onto a dead route is an orphan from its spawn to its first tick. it holds the clone's one slot, so a concurrent drive of a live route finds the slot taken and leaves its focus to a daemon that is about to exit. that orphan window sent two nudges in one interval on this clone in 5.1, and the 5.1 peer review (`enroll-impl-arch-defects`, round i004, blocker.1) required that gen refuse the spawn. the `handle-lost` exit bounds an orphan after a reclaim; it does not stop a gen from the spawn of one.

the real detached-spawn coverage the old acceptance case4 held lives on in acceptance case18 (gen on a live route: a real pid, reaped after `del`) and case22 t1 (gen on a bound live route, the same assertions).

## .rework

clean. one branch in `routeReminderGen` (the `activityBefore` arm), its stdout line, and cli case11 / acceptance case4. no caller depends on a spawn from a dead route; route.drive never calls gen.

## .confidence

85%. the trade is a contract change on a verb a human runs by hand, and the wish never names it. it rests on a reviewer's verdict and a measured orphan, not on a human's word.

## .where

`src/contract/cli/route.reminder.ts` (`routeReminderGen`); cli case11, case21; acceptance case4.

## .verdict

open: for the council.
