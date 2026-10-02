# F7 — stone entry has no event; which surface detects it

**rework** = clean · **status** = open · **confidence** = **85%** — ⬆️ from 60% at self-review r3, on
a line-by-line read that found the detector already on disk

## .the fork, stated fairly

the wish says the hook applies the switch "on entry". **there is no stone-entry event.**

the driver role declares three hook contexts (`getDriverRole.ts:25-70`), and `.claude/settings.json`
wires them: `SessionStart`, `PreToolUse`, `Stop`. none of them means "the current stone changed".

the candidates:

| candidate | how it detects entry | cost |
|---|---|---|
| **`route.drive --when hook.onStop`** | already fires after every turn; compare the current stone against the last stone it saw | fires constantly; needs a memo of the prior stone to avoid a re-dispatch each turn |
| **`PostToolUse` on Bash, after `route.stone.set`** | the stone advances exactly when `--as passed`/`approved` succeeds | a new hook; and passage can also advance via other paths |
| **`route.stone.set` emits it directly** | the operation that advances the stone also dispatches the switch | no hook at all — but the issue explicitly assigns the apply to the **driver role's hook**, not the route engine |
| **`route.drive --when hook.onBoot`** | catches a mid-route session start | necessary but not sufficient — it misses every in-session advance |

## .taken, and why at the time

**`route.drive` at both `hook.onBoot` and `hook.onStop`, with a compare against the live brain.**

- `route.drive` already reads the current stone on both contexts, so the stone is in hand
- the compare that `case=6` requires (declared vs live) **doubles as the entry detector**: if the
  declared brain already matches, dispatch naught. so no separate "did the stone change" memo is
  needed — the idempotency does the work
- `onBoot` covers a session that starts mid-route; `onStop` covers every in-session advance

⇒ this leans on `rule.require.fewer-paths-via-idempotency`: rather than a branch that detects entry,
make the dispatch idempotent and run it unconditionally.

## 🔴 .this file cited the rule and stopped one branch short — found 2026-09-10

read the two clauses above together:

| the clause | what it does with the rule |
|---|---|
| line 32 — *"make the dispatch idempotent and run it unconditionally"* | ✅ **applies it** — to the ENTRY branch |
| line 27 — *"the compare that `case=6` requires … doubles as the entry detector"* | 🔴 **exempts** the very same rule's target — the COMPARE branch — and then **leans on it** |

⇒ 🔴 **the design deletes one branch by the rule and keeps a second branch that the same rule
forbids, in one paragraph.** and the kept branch is load-bearing here: this file's entry detection is
built on it.

🟡 **the tell is the phrase *"the idempotency does the work."*** it is true of the dispatch and it is
what makes the compare unnecessary — so a design that invokes idempotency **to justify a compare**
has the argument backwards. the idempotency is what lets you drop the compare.

⚠️ **that half of this fulcrum is superseded by `F14`.** the entry detector no longer rests on a
compare at all: r3 found `stateBefore.stone !== stone.name` already on disk, and `F14` deletes the
compare outright. ⇒ **the two corrections are independent and they agree**, which is the strongest
form of evidence this route has produced for either.

## .the counter-case, stated fairly

it read: *"it depends entirely on `F5`. with no way to read the live brain, the compare cannot run,
and without the compare this design has no entry detector at all — it would re-dispatch every turn."*

🔴 **that is FALSE, and the correction is measured — self-review r3.**

and `hook.onStop` runs at a bounded timeout on a context that already halts stops. to add a socket
dispatch there is to add work to the repo's most load-heavy hook. **that half of the counter-case
stands.**

## 🔴 .the detector is ALREADY ON DISK — corrected at self-review r3

`onStop` persists the stone it last saw. this was found by a line-by-line read of the call chain the
r1 review had skimmed:

```
stepRouteDrive.ts:295            → setDriveBlockerState({ route, stone: stone.name })
setDriveBlockerState.ts:25-31    → writes new DriveBlockerState({ count, stone }) to
                                   $route/.route/.drive.blockers.latest.json
getDriveBlockerState.ts:22-25    → reads { count, stone }; stone defaults to null on a fresh state
```

⇒ **`stateBefore.stone !== stone.name` IS the stone-entry edge**, evaluated at `onStop`, keyed by
exactly the right thing, with no new persistence invented and **no live-brain read at all**.

| what changes | before | after |
|---|---|---|
| the entry detector | the declared-vs-live compare, doubling as one | 🔴 a **stone-change** compare, which is a different and cheaper fact |
| the dependency on `F5` | *"depends entirely"* | ✅ **none.** the two are now independent |
| what the live compare is for | detection **and** verification | verification only — `case=3`'s halt |

🔴 **the de-coupling is the valuable half.** `F5` is the dirtiest item in this inventory and `F7` was
the lowest-confidence; the vision had them chained, so a refusal of `F5` read as a collapse of the
entry mechanism too. it is not. **`F7` stands on its own, on a field that already exists.**

⚠️ **and the field is currently WRITTEN AND NEVER READ.** `setDriveBlockerState` increments
unconditionally (`stateBefore.count + 1`), so no caller consults `.stone`. that is why a grep for its
use returns no hit, and why the r1 read missed it — **a dead field is invisible to a usage search,
and visible only to a read of the writer.**

🟡 it also surfaces a latent defect that is **not this feature's to fix**: the 21-block cutoff
accumulates across stones, since the count never resets on a stone change. caught as a dream rather
than repaired here.

## .rework, and why

**clean.** the surface that detects entry is internal. no guard field, no artifact, and no user-faced
contract depends on which hook fires.

## .confidence — 60% → 85%, and the reason it moved

it read 60% because *"this is a best guess made from a hook inventory, not from a close read of the
route engine. `stepRouteDrive.ts` is 660 lines… read at a summary grain, not line by line."*

**the close read happened, at self-review r3, and it raised the call rather than moved it.** three of
the four unknowns that justified the 60% are now measured:

| the unknown | measured |
|---|---|
| can `onStop` host it? | ✅ it already writes to disk there (`stepRouteDrive.ts:295`) |
| does a stone-change signal exist? | ✅ `DriveBlockerState.stone`, persisted, at the right hook |
| does it depend on `F5`? | ✅ **no.** the de-coupling above |
| does the hook timeout admit a socket dispatch? | 🔴 **closed 2026-09-25, at the execution stone** — this was the whole residual 15%. see below |

⇒ so the residual was **one question about latency**, not four about design. and it was a question
the blueprint stone answers by measurement rather than by argument: `clone say`'s submit-verify polls
up to 15s against the hook cap (**F-d**), so a fire-and-forget dispatch is required — which `case=5`
already independently requires for a different reason.

> 🔴 **the measurement, 2026-09-25.** `clone whoami` p50 = **5537ms**, which exceeded the whole
> vision-time 5s budget, so the two `route.drive` sites were raised to `timeout: 25`.
>
> ⚠️ **the answer is YES, and only just.** a 10s probe cap plus a 15s verify is **exactly 25s**, with
> naught left for the render. ⇒ the detached dispatch is no longer merely the safe choice — it is
> what keeps the entry tick inside its own budget.

🟡 **the two constraints converge on one design**, which is why 85% rather than 70%: `case=5` says
*do not wait* to avoid a deadlock, and the budget arithmetic above says *do not wait* to avoid a
timeout. **one mechanism satisfies both** — and the raise did not loosen that, it tightened it.

## .where

`1.vision.experience.case=1.the-stone-switches-my-brain.md` — `[t0]`.
`1.vision.experience.case=6.the-brain-is-already-right.md` — `[t0]`, the compare this leans on.

## .the verdict

open — for the fulcrum council, and for a closer read at the blueprint stone.
