# F27 — a kill mid-await leaves a live claim and no dispatch, for up to 15s

**rework** = 🔴 dirty · **status** = open, earmarked to the wisher · **confidence** = 70%

## .why this is a fulcrum

a peer reviewer graded the window a blocker: a requirement must be met or explicitly deferred by the
wisher, and the build had accepted it alone. this entry is the earmark.

## .the fork

the vision's bound: *"a switch that was ASKED for and did not happen → fail loud."* this arm breaks
it for up to 15s.

| step | what happens |
|---|---|
| 1 | the claim is written before the dispatch |
| 2 | the hook is killed at its cap |
| 3 | `setEntry` and `delClaim` never run; the claim's mtime is fresh |
| 4 | every peer and next tick reads the claim live and stands down |
| 5 | the drive renders `{ outcome: 'none' }` — byte-identical to `case=10` — until the mtime expires |

step 1's order is forced: to hold the state lock across a multi-second probe would blow its 500ms
acquire deadline. at the vision-time `timeout: 5`, step 2 fired on every healthy entry tick
(`clone whoami` p50 = 5537ms); at `timeout: 25` the kill is rare again, never absent.

| option | verdict |
|---|---|
| **accept the window** — bounded at `BRAIN_DISPATCH_CLAIM_WINDOW_MS`, healed at the first tick after | taken |
| A — shorten the window | trades away the pty interleave protection the claim exists for |
| B — a liveness pid in the claim | re-introduces the `O_EXCL`-plus-reap shape the claim is not |
| C — write the claim after the dispatch | refused: two ticks both dispatch into a live pty |

## .taken, and why

a 15s silence that heals itself beats a pty corruption that does not; A and B each buy the fix with
the guarantee the claim was built for.

## .the counter-case — real

- the silence is identical to `case=10`, so a driver reads *"no brain"* where the truth is *"the
  switch is still owed"* — the conflation the wish names
- the self-heal repairs the state, not the belief of a driver who read the drive inside the window
- the option set is unproven complete: a generation counter was never costed, and a **render mark**
  — one line that says a claim is live — would end the conflation with no change to the claim

## .rework — dirty

B changes `BrainDispatchClaim`'s shape across `genBrainDispatchClaim`, `isBrainDispatchClaimLive`,
`delBrainDispatchClaim`, their suites, and the acceptance snapshots.

## .where

`brain/applyStoneBrainOnEntry.ts` · `brain/genBrainDispatchClaim.ts` · `brain/BrainDispatchClaim.ts` ·
`blackbox/driver.route.brain.acceptance.test.ts` (the residuals table)

## .the verdict

open.

⇒ the full entry: `../appendix/.fulcrums/inventory.of=fulcrums.case=F27-a-kill-mid-await-leaves-a-live-claim-and-no-dispatch.md`
