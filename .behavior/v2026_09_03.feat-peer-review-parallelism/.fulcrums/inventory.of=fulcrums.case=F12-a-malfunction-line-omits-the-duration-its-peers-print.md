# fulcrum F12 — a malfunction line omits the duration its peers print, and this feature leaves it that way

- **case** = F12
- **title** = a malfunction line omits the duration its peers print, and this feature leaves it that way
- **rework** = **clean**
- **status** = OPEN — deferred, dream caught
- **confidence** = **92%**
- **raised** = 2026-09-11, at i002 r009 (`arch-hazards-behavior`) · **re-raised 2026-09-12 at i003 r010** (`enroll-impl-behavior-intent`, nitpick.4)

## 🔴 .why this row exists at all — the deferral was recorded and the JUDGMENT was not

the dream was caught on 2026-09-11 and no fulcrum accompanied it. that is a defect by
`rule.always.catch-dreams-for-followups`' own words:

> *"a deferral for DIRT owes a FULCRUM too. the dream records the work; the fulcrum records the
> decision to defer it. a dream alone reports the work and hides the call."*

🔴 **and the concealment was measured rather than theorized.** i003/r010 read the dream, agreed the
deferral was reasonable, and still graded the item a nitpick worth raising — *"the most 'make one
small formatter change and clamp it' of the deferred items"* — because **the dream states the dirt
and no artifact states that a driver weighed it and chose.** a reader of `.dream/` alone sees a task;
they do not see a call.

## .the fork, stated fairly

a settled lane renders its duration; the one lane whose duration **is** the diagnosis does not:

```
   ├─ r1: slow-reviewer (l1, 0/2)
   │   ├─ malfunction 💥                    ← no duration
   │   ├─ terminal — does not block higher levels
```

beside `…peer-budget-multimember-l1…snap:8`:

```
   │   ├─ rejected [TIME]
```

| the option | what it costs |
|---|---|
| **A — render `[TIME]` on the malfunction arm here** | 🔴 re-cuts **four** of the 36 snapshots vision acceptance 2 froze |
| **B — leave it, catch a dream** | the driver-facing gap this feature widens ships unrepaired |
| **C — render the BOUND rather than the elapsed** | honest for a killed process, and it is a **different** repair with its own argument — see below |

🟡 **C is enumerated because the dream itself flags it as possibly correct**: *"a killed process has
no honest end instant — check that before you change it."* so the fork is not two-way, and the third
arm changes what the fix even is.

⇒ that check is **unperformed**, and it is the reason this row is not a straight A-versus-B.

## .taken, and why at the time

**B.** and the reason is not cost — it is a **declared commitment**:

> vision acceptance 2: *"a correct implementation leaves all 36 of these alone… any diff is a defect
> report rather than expected churn."*

🔴 **the round whose whole claim is *"these 36 did not move"* cannot be the round that moves four of
them for an ergonomic polish.** the four are `peer-budget-malfunction`,
`peer-malfunction-nonterminal-higher`, `peer-contemplation-malfunction`, and `peer-review-timeout`.

⚠️ **and the wisher's attention is the scarce term, not the risk.** this branch already owes them one
unasked-for snapshot movement, corrected by measurement from 8 to **23** files. a second, unrelated
movement would arrive under the same question, and the first becomes harder to judge for it.

## .rework, and why it is CLEAN

one branch in one formatter, plus a `--resnap`. the elapsed time is **already held** —
`GuardProgressEvent.inflight` carries `{ beganAt, endedAt }` and the formatter reads it for every
other outcome — so the change removes a suppression rather than adds a measurement. no caller hardens
against the current render.

## 🔴 .it is the SECOND entry of F11's shape, and that is what makes the shape a pattern

| | F11 | 🔴 F12 |
|---|---|---|
| is the **fix**, in this diff, clean? | 🔴 no — four untouched snapshot files | 🔴 no — four **frozen** snapshot files |
| is the **rework**, later, clean? | ✅ yes | ✅ yes |
| what the dirt is | a repo-wide render this feature did not author | 🔴 **a commitment this feature's own vision declared** |

⇒ F11 established that *"rework clean"* does not imply *"could have ridden along."* **F12 sharpens
it: F12's dirt is stronger than F11's**, because F11's four snapshots are merely untouched while
F12's four are the literal oracle of an acceptance criterion this round claims to have met.

🟡 **so a single row is now two rows, and the shape has a name.** one instance is an anecdote about
one render; two are evidence that `fix-forward-under-scouts-honor`'s two questions come apart often
enough that a fulcrum table wants a column for it.

## .confidence, and why it is not higher

**92%.** the 8% is two distinct doubts, and the second is the larger:

1. a wisher who reads acceptance 2 as *"the 36 did not move **for concurrency reasons**"* rather than
   *"the 36 did not move"* would permit this repair inside the round. that is a defensible read of a
   criterion written before the render restructure was scoped
2. 🔴 **option C is unpriced.** if a killed process has no honest end instant, then A is the **wrong**
   repair and the deferral was right for a reason this row never checked. a fulcrum that defers
   between options where one may be unbuildable is exactly the defect F4 recorded
   (`.THREE fulcrums fell to the same defect`) — **and it is recorded here rather than smoothed over**

## .where

- `.dream/v2026_09_11.fix.a-malfunctioned-lane-renders-no-duration.md` — the caught fix, with the four affected snapshots named
- `blackbox/__snapshots__/driver.route.peer-review-timeout.acceptance.test.ts.snap:6-10` — the rendered lane
- `blackbox/__snapshots__/driver.route.peer-budget-multimember-l1.acceptance.test.ts.snap:8` — a settled lane, for contrast
- its peer dream: `.dream/v2026_09_09.fix.a-timeout-message-names-the-bound-and-not-the-contention.md` — **two repairs of one diagnosability gap**

## .what would overturn it

**a measurement, and it is cheap: read the formatter's malfunction arm and settle whether `endedAt`
is honest for a killed child.**

| the read says | then |
|---|---|
| `endedAt` is set and honest | option **A** is right, and the only question left is *which round* — a wisher call |
| `endedAt` is absent or fabricated for a kill | 🔴 option **C** is right, and this fulcrum's taken option was never the alternative it priced |

⇒ 🔴 **that makes F12 the F10 shape rather than the F2 shape** — its overturn condition is a probe a
traveler can run, never *"a wisher who rules."* per this inventory's own finding, a fulcrum whose
condition is a measurement can close itself; one whose condition is a ruling cannot.

🟡 **the probe was deliberately not run in this round**, because its outcome changes no act this
round may take: both A and C move the same four frozen snapshots. **it is owed by the round that owns
the render**, and it is stated here so that round does not re-derive the question.

## .the verdict, once ruled

— unruled.
