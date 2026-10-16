# F39 — the lock RE-READS where it could thread the probed pid

| | |
|---|---|
| **rework** | **clean** — `isReviewWarmerAlive` would return its lock instead of a boolean; two call sites |
| **status** | 🟡 **BEST-GUESSED 2026-09-26 — option A: keep the re-read, state its reason.** raised as a peer nitpick (`i010 r011`, `enroll-impl-arch-defects`) |
| **confidence** | 🟡 **88%** that the re-read is right · 🔴 **55%** that a fork this small earned a row rather than a comment |

## .the fork

`genOneReviewWarmerLock` opens the pid file **twice** on a contended claim: once inside
`isReviewWarmerAlive` (which parses it to refute a recycled pid), then again in
`getOneReviewWarmerPid` to render the holder for the driver.

| fork | what it buys | what it costs |
|---|---|---|
| **A — re-read** (taken) | the rendered pid is read at the moment it is rendered, so a holder that exited in the gap answers `null` rather than a dead pid | one extra `readFileSync`, on a path taken at most once per lane per round |
| **B — thread the probed lock** | one open | the driver is handed the pid that was live **when the probe ran**, so `stop: kill <dead pid>` renders as though it were live |

## .why A holds

two facts, each checkable against the source, and **neither was written down** — which is what
invited the concern:

1. **`EEXIST` proves EXISTENCE, never content.** it says naught about the pid inside, so a content
   read is owed regardless of what the failed create told us
2. **on the stale path it is not the same file.** `rmSync` deletes it, the second `claim()` fails on
   a peer's NEW file, and the re-read is the only way to see that file at all
   (`genOneReviewWarmerLock:193-199` already argues this)

⇒ so the two opens answer about **different moments**, and B collapses them into one answer that is
correct for neither.

## 🔴 .why it is a fork and not a fix

the reviewer's cost argument is real in the general case — a check-then-act pair with two opens is
this repo's own named smell, and `arch-hazards-maintenance` raised exactly that shape on
`getOneReviewerLastRunAt` in the same round. **what parts them is whether the second read sees a
file the first could not**, and that is a judgment about the file's generation rather than a rule
anyone can grep for.

🟡 the fd-pressure half of the argument does **not** reach it: the hazard the bound in
`getAllFileContentsByGroup` exists for is a FAN of hundreds, never a second sequential open. that
bound is about the descriptor table under a `Promise.all`; this is one open after another.

## .what was done

the code is **unchanged**; its reason is now stated in place
(`genOneReviewWarmerLock.ts`, the `.note` above the `isReviewWarmerAlive` branch).

⇒ that is the same repair `asReviewWarmerPaths` needed on this branch: **a comment that names the
wrong protection licenses the defect it warns about, and one that names no protection invites the
reader to supply their own.** here the live path's comment argued the `UNKNOWN`-vs-`0` choice and
said naught about the second read, so a reader met two opens with one stated purpose.

## .what would overturn it

- a measurement that the second open is on a hot path (it is not — at most once per lane per round)
- a variant of B that returns the **file generation** beside the pid, so a threaded lock could
  answer *"the holder I probed is gone"* rather than repeat a stale pid. that composes with A's
  guarantee rather than a trade against it, and nobody has costed it

## .where

- `src/domain.operations/review/warmer/genOneReviewWarmerLock.ts`
- `src/domain.operations/review/warmer/isReviewWarmerAlive.ts`
- `src/domain.operations/review/warmer/getOneReviewWarmerPid.ts`

## .the verdict

_(unruled)_
