# F232 — the warmer value verdict is graded alter

- raised 2026-10-12, by `behavior-experience-coverage` (blocker.1), at 5.3 i003
- rework: **clean** — a re-grade to criti adds one `case=N` demo and edits two catalog rows
- status: 🟡 **BEST-GUESSED**
- confidence: **80%**

## .the fork, stated fairly

the catalog now verdicts `engine × {tree, grove} × cost × {observe, defend}` as served. those
cells hold the warmer value block (`asWarmerValueLines`, on `--of tree` and `--of grove`): spent,
`saved ≤`, `net`, and a verdict of `loss` / `maybe` / `unproven`.

| option | the claim |
|---|---|
| **A — alter** | the harm cell is `engine × run × cost × defend`, already demoed at `case=7`: the spend is recorded. a wrong value verdict costs a misread advisory, and `--warmer off` is the fallback |
| **B — criti** | the verdict is the one surface that tells a driver whether a warmer pays for itself. a verdict that reads `maybe` where the truth is `loss` keeps a spender awake, and money leaks |

## .taken, and why

**A.** the money the warmer spends is never hidden: `case=7` clamps that every poke lands in a
meter. the value verdict sits one step above that record — it weighs the recorded spend against
an upper bound on savings. a wrong weight misleads a choice; it does not hide a cost. the
`defend` cells clamp the sharpest error — a verdict never weighs an amount saved it could not
price (`unproven`, `runsUnpriced`, `costAwaited`), by `asWarmerValueLines.test.ts` and
`getOneWarmerValue.integration.test.ts`.

## .rework, and why

**clean.** a re-grade to criti owes one `case=N` demo for `engine × tree × cost × defend` and a
care edit on four rows in `1.vision.experience.case=_.md`. no code, no contract, no caller.

## .confidence, and why it is not higher

option B names a real harm path: a warmer left awake on a `maybe` that should read `loss` spends
every round. the `saved ≤` bound is an upper bound by construction, so the verdict errs toward
`maybe`, and that bias favors the spender. a council that weighs that leak above the `--warmer
off` fallback would grade it criti.

## .where

`.behavior/v2026_09_20.review-cost-meter/1.vision.experience.case=_.md` — the engine half, and
`### why the value verdict is alter, not criti`

## .verdict

— (awaits the council)
