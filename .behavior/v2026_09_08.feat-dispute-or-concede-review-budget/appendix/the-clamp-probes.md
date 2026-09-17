# appendix: the clamp probes

the evidence under the yield's claim that each clamp has teeth. `rule.require.clamp-edge-cases`
demands a clamp go red under the un-fixed defect, so each row below is a defect re-introduced on
purpose and the assertions that fired.

⇒ cited from `5.1.execution.from_vision.yield.md`. it states the verdicts; this holds the runs.

## .the probe table

| the clamp | the probe | what fired |
|---|---|---|
| the stance predicate | swap the residual verdict for the raw `blockers > 0` the contemplation gate uses | `[case5] [t0]` red — the nitpick-only lane at `allowNitpicks 0`. ⚠️ `[t1]` stayed green: at `allowNitpicks 7` the lane is approved either way |
| the concede ack's sequence | invert `fix the $severity — then buy the round` | **1 failure, the snapshot alone.** the named order assertion stayed green — both phrases sit on one line, so line ordinals do not move |
| the same, repaired to compare character offsets | the same inversion | **2 failures** — the assertion and the snapshot both |
| the tree's disputed state | the render removed | 3 named assertions + the snapshot |
| the same | the order inverted — the skip below the forgive | **the order assertion ALONE.** the snapshot lives in `[t0]`, which carries no forgive |
| the budget emit | the dark rows dropped | 3 named assertions, all on `[case3]` |
| the same | the scope word drifted to `this stone` | 4, both `[case4]` directions among them |
| the tea-pause pre-emption (`[case14]`) | `computeStancePrompt` returns `null` | **5 of 6** — the prompt, both words, the menu string, `--as blocked`, the snapshot. ⚠️ `stderr.code === 2` stayed green |
| the human-only guidance | revert the list to its four pre-stance lines | **5 of 5** — two suites, two named assertions, two snapshots |

## .the three instances of one lesson

the yield states the lesson; these are the three grains it was measured at.

| grain | the instrument | what it could not see |
|---|---|---|
| a line ordinal | the ack's order assertion | a within-line inversion — the ordinals do not move |
| a snapshot | the tree's `[t0]` snapshot | a case it does not cover — `[t0]` carries no forgive |
| an exit code | `[case14]`'s `stderr.code === 2` | a body it does not read — a generic onStop push emits 2 exactly as a stance halt does |

⇒ **an instrument covers the axis it measures and no other**, so a suite that goes red is not
evidence that the clamp written for the defect is the clamp that fired.

## .the two silent-union finds

both are the same mechanism at two grains, and the audit that found them is the same one.

| the union | the members | what absorbed it |
|---|---|---|
| `RouteStoneGuardBlockerType` + `'review.peer.undeclared'` | three consumers read it through an `if`-cascade with a default tail | `asRouteStoneDisposition` → `push` (right answer, wrong mechanism) · `stepRouteStatusLine` → `judge` (wrong) · `getRouteDriveBlockerMessage` → `null` (wrong, and the one dispatcher for all three drive surfaces) |
| `GuardProgressEvent.outcome.review` + `{ disputed, blockers, nitpicks }` | the new member structurally satisfies `'blockers' in review` at `genContextCliEmit:441` | `build:compile` flagged **16** producers of the two new required fields and stayed silent on the one path that carried the flag |
| `asRouteStoneDisposition`'s `reason` optional param | five call sites compiled green; four passed no reason at all | the concession would have been invisible everywhere but the site edited alongside it |

⇒ **a compiler's noise is not evidence that its silence is meaningful** — the second row is the
sharp one, since the compiler was loudly useful 16 times in the same pass.

⇒ the audit that found every one: **grep the call site, never read the declaration.**
`asRouteStoneDisposition\(\{` found all five in one pass; a grep for the nearest peer blocker
`'review.peer.uncontemplated'` found two of the three consumers the vision had not named.
