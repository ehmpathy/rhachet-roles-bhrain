# F124 — the stop hook's blind spot for delegated work defers to a dream

- raised 2026-10-07, by the driver, at 5.1 i012: `route.drive --when hook.onStop` nudged five turn
  ends in a row while the round's repairs ran in a background delegate
- rework: **dirty** — a new route state and a new hook branch, inherited by every route
- status: ✅ **REVERSED — option A taken**
- confidence: **85%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — fix it in this stone** | the friction was hit here, by the dogfooder; `rule.forbid.workarounds` says fix it now |
| **B — catch it as a dream (taken)** | the fix adds an inflight watermark the drive hook reads — a contract change to a hook every route inherits, outside the review cost meter this stone ships |
| **C — no change** | the nudge costs a turn of text and no more; the driver can keep doing in-scope work while it waits |

## .taken, and why

**B.** the hook offers three moves — arrive, pass, block — and each is wrong while repairs are in
flight: an arrive burns a budget round per lane on a half-repaired artifact. the honest state has
no representation. the cure is a watermark the driver writes on delegation and `--as arrived`
clears; its shape is in the dream.

## .rework, and why

**dirty.** a new state file under `.route/`, a new branch in the drive hook, and a clamp — a
contract other routes inherit, not a line in this diff.

## .confidence, and why it is not higher

- A has real weight: the dogfooder hit it, and a dream is the second-best outcome
- C is defensible: the nudge did not block the work, and the wait was spent on test sweeps

## .where

`.dream/v2026_10_07.fix.route-drive-onstop-blind-to-delegated-work.md` · the drive hook
(`rhx route.drive --when hook.onStop`)

## .verdict

**REVERSED — option A taken.** the friction did not stay a one-off: the nudge recurred across many
turn ends while delegated repairs ran, so its cost compounded every round the dream sat unfixed — a
dogfooder's friction with its own tool (`rule.forbid.workarounds`). it was fixed in this stone:
`rhx route.stone.set --stone <s> --as inflight --what '<text>'` writes `$route/.route/inflight.json`
(`{ stone, since, what }`, `since` in epoch ms); `route.drive --when hook.onStop` reads it — fresh
(< 60m) on the current stone → one quiet `⏳` line, exit 0; stale → the usual nudge plus a line that
names the stale watermark; absent → unchanged. `--as arrived`/`passed` (and a declared `--as blocked`)
clear it. clamped in `stepRouteDrive.integration.test.ts` [case16], proven to go red without the read.
