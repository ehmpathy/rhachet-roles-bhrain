# F77 — the warmer stop line is pinned below the cli

- rework = **clean** — an acceptance case could be added later with no ripple
- confidence = 🟡 **75%**
- raised.by = r024 enroll-impl-behavior-intent nitpick.1, at i034

## .the fork

r024 found no acceptance test that drives a real warmer spawn and asserts the `pid:` and
`stop: kill <pid>` lines a driver needs to stop a live spender.

| option | what it costs |
|---|---|
| concede | an acceptance case that spawns a detached warmer, which pokes a paid brain on a timer, from the cli suite |
| dispute | rests on the coverage that already pins the line, one grain down |

## .taken — dispute

the line is pinned at the grain that renders it, and the spawn is proven at the grain that runs it:

- `emitReviewWarmerSpawn.test.ts` snapshots `├─ pid: 4242` and `└─ stop: kill 4242` on every spawn
  variant, so a renamed field or a dropped row fails the unit suite
- `asWarmerKillCommand` is the one home of the `kill <pid>` text, read by both the stop line and
  the re-plan line
- `genReviewWarmer.integration.test.ts` spawns real detached warmers and kills them by the pid the
  spawn returns
- `emitReviewWarmerDisowned.integration.test.ts` asserts `pid: <n>` on stderr from a real process

an acceptance case would add a paid, timed, detached process to the cli suite to re-prove a row
two lower grains already hold.

## .verdict

🟡 BEST-GUESSED 2026-10-01 — dispute.
