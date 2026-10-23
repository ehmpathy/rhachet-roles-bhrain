# F271 — route refusals render bare, as the route family does

- raised 2026-10-12, by `ergo-snapshot-visual-blemishes` (blocker.6), at 5.3 i004
- rework: **dirty** — an owl frame on every `rhx route.*` refusal touches every route acceptance snapshot
- status: 🟡 **BEST-GUESSED — disputed in part; the json half is repaired**
- confidence: **80%**

## .the fork, stated fairly

the lane reads `route.stone.add` refusals as bare where peer route refusals carry `🦉 woah there`,
and asks for the frame plus the metadata json dropped.

| option | the claim |
|---|---|
| **A — keep the bare `✋ ConstraintError:` frame; drop the json** | the route family renders its caught caller faults bare, at one seam (`asConstraintErrorHeader`). the json is noise, and is now dropped there |
| **B — wrap every route refusal in the owl frame** | a reader should meet one frame across commands |

## .taken, and why

**A.** the peer claim does not hold on the cited evidence:
`blackbox/__snapshots__/driver.route.guard-upgrade.acceptance.test.ts.snap` pins seven refusals, and six
of them open bare (lines 63, 124, 149, 154, 178, 189). only one (line 98) carries `🦉 woah there`. so the
bare shape is the route family's norm, and `route.stone.add` matches it.

the json half is right, and it is repaired at the shared seam: `asConstraintErrorHeader` now parts
the bag off via `asHelpfulMessageParts` and keeps only its `hint` as a labelled line. that lands on
`route.stone.add` and on every other route refusal at once.

## .rework, and why

**dirty.** an owl frame for the route family changes the seam every `rhx route.*` command throws
through, and with it every route acceptance snapshot that pins a refusal.

## .confidence, and why it is not higher

two frames do coexist in the route family (the guard-upgrade line 98 refusal is framed). whether
the route family should converge on the owl frame is a cross-command call the council may make.

## .where

`src/contract/cli/asConstraintErrorHeader.ts` · `src/contract/cli/route.ts`

## .verdict

— (awaits the council)
