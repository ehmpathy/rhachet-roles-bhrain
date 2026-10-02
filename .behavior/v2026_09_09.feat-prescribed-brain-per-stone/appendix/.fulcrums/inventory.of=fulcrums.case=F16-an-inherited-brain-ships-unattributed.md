# fulcrum F16 — an inherited brain ships unattributed

**raised** 2026-09-14, at self-review `behavior-declaration-coverage` on `5.1.execution.from_vision`
**rework** = 🔴 dirty · **status** = 🔴 **SETTLED — built at i033** · **confidence** = 80%

> 🔴 **the wisher never had to rule on this. a peer reviewer raised it as a blocker (i033 r008
> blocker.1) and it was built rather than deferred.** ⇒ the deferral this fulcrum reserved was
> overturned by a reviewer, never by a council — which is the outcome a fulcrum list is meant to
> make possible: the call was **visible**, so someone else could take it.

## .the fork, stated fairly

`case=7` `[t2]` requires a line on a stone that declares no brain **after** a switch has happened:

```
🗿 3.4.roadmap
   └─ brain claude-opus-5[1m]   (inherited; last set by 3.3.1.blueprint)
```

two ways to meet the round's close:

| | the choice |
|---|---|
| **taken** | ship without it. the `none` branch prints no line, and the inherited brain is unattributed |
| **rejected** | build the per-route brain-provenance state this round, and render the line |

## .what was taken, and why at the time

**ship without it**, because the attribution cannot be built cheaply and the round's subject is the
dispatch.

⇒ `case=7` is an **alterpath**: its cost is money rather than a wrong result, and its own `[t4]`
names a workable route around it — declare the cheap brain explicitly on the routine stone.

## 🔴 .the counter-case, and it is strong

`case=7`'s argument for `F6`'s sticky verdict rests on the attribution:

> *"sticky without attribution is a cost that appears from nowhere; sticky **with** attribution is a
> cost a human can trace to the stone that caused it and fix in one edit."*

⇒ **so this ships the half of `F6` that costs money and not the half that makes the cost
traceable.** a reviewer may fairly read that as `F6` delivered in name only.

⚠️ **and it compounds with `case=8`.** that case's whole claim is that a prescription nobody can
verify is a preference rather than a control. `[t4]` — *"a stone inherited a brain from an earlier
stone: the record names the stone that set it"* — is one of its four obligations, and it is the one
this defers.

## .why it is dirty

the attribution needs state that outlives a stone, and the extant state does not:

```
stepRouteStoneSet.ts:112   await delDriveBlockerState({ route: input.route });
```

⇒ `DriveBlockerState` is **deleted on passage**, at precisely the boundary the attribution must
cross. so a field on it is not the fix; a new persisted artifact is — with its own lifecycle across
halt, block, and rewind.

🔴 **and a cheap render is not available either.** `case=10` demands byte-identical output on a stone
that declared no brain from launch. the two cells differ **only in history**, so a line that cannot
read the history fires on both — and breaks every extant stone-entry snapshot in every repo.

⇒ **a reversal is a new artifact plus a lifecycle, never a render change**, which is what `dirty`
means here.

### 🔴 .that last claim was WRONG, and the correction is the most durable line on this page

*"a field on it is not the fix; a new persisted artifact is"* was an inference from a true premise,
and it did not follow. the premise — the del is on the page, at the boundary — held exactly.

⇒ **the leap was to treat `delDriveBlockerState`'s BEHAVIOR as a fixed constraint** rather than as
one more surface under this feature's hand. and the op's own `.what` already refused that read:

```
.what = resets the drive blocker count to 0
```

⇒ its stated job is a **count reset**; the `fs.rm` was a mechanism that over-reached its own declared
intent, and had done so long before this feature existed. so the fix was a **narrow of the delete** —
preserve the attribution where one exists, unlink where it does not — and the extant field carried
the state after all.

| | the deferral's read | what held |
|---|---|---|
| the del | an invariant to route around | a **defect**, repaired at cause |
| the state | too short-lived to carry it | long-lived once the del stops to over-reach |
| the cost | a new artifact + its lifecycle | **one branch**, plus a clamp |
| `case=10`'s byte-identical bound | threatened by any new render | **held byte-for-byte** — the unlink still runs when no brain was ever set |

🟡 **and the misread was expensive in the exact way a fulcrum exists to prevent.** it argued this
dirty for three rounds and named a build nobody would authorize, while the honest fix was one `if`
behind an op whose header said what it was for.

⇒ **the durable lesson: a `dirty` grade computed against a dependency's CURRENT behavior is worth
only as much as the question "and may I change that behavior?"** — which this fulcrum never asked.

## .where

- `src/domain.operations/route/stepRouteDrive.ts` — the `outcome === 'none'` branch that prints naught
- `src/domain.operations/route/stepRouteStoneSet.ts:112` — the del that forbids a field on the extant state
- `.dream/v2026_09_14.feat.an-inherited-brain-is-unattributed-on-the-stone-that-runs-it.md` — the work

## .confidence, and why it is high

**80%.** the mechanical claim is measured: the del is on the page, and the `case=7`/`case=10` cells
genuinely differ only in history. what is a judgment is the **grade** — whether an alterpath demoed
in the vision may ship unbuilt at all. a wisher who reads the demo as a commitment rather than an
illustration would rule the other way, and that call is theirs.

## .the verdict, once ruled

🔴 **SETTLED 2026-09-17 — the deferral was overturned, and the attribution is built.**

ruled by **a peer reviewer**, not the council: i033 r008 blocker.1 — *"sticky-brain attribution
(vision case=7) is not implemented — case16c asserts the opposite of the spec."*

### what shipped

| move | where |
|---|---|
| a `DriveBrainInheritance { slug, stone }` record on `DriveBlockerState` | `drive/DriveBlocker.ts`, `drive/asDriveBlockerState.ts` |
| written on the `requested` arm alone, so its ABSENCE is meaningful | `brain/applyStoneBrainOnEntry.ts` |
| a fourth `inherited` outcome arm + its formatter | `brain/setStoneBrain.ts`, `brain/formatStoneBrainInherited.ts` |
| a per-ROUTE gate, so `case=10` pays zero I/O and returns first | `brain/isRouteBrainDeclared.ts` |
| 🔴 the del narrowed, so the record survives passage | `drive/delDriveBlockerState.ts` |
| `case16c` `[t0]` inverted to pin the line; `case16d` added to pin the silence | `stepRouteDrive.integration.test.ts` |

### the clamp that bites

`drive/delDriveBlockerState.integration.test.ts` — dogfooded with `if (false && before.brain)`:
**5 passed / 2 failed**, and the two reds were exactly the brain-survival rows while `[case1]`'s
unlink stayed green. ⇒ it discriminates rather than merely passes (`rule.require.clamp-edge-cases`).

### what `case=7` gains, and `case=8` with it

`F6`'s sticky verdict is now delivered in full rather than in name: the cost is sticky **and**
traceable to the stone that caused it. `case=8`'s fourth obligation — *"a stone inherited a brain
from an earlier stone: the record names the stone that set it"* — is met.
