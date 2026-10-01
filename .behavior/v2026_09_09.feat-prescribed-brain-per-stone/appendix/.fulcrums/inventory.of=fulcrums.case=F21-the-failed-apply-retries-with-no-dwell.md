# fulcrum `F21` — a failed brain apply retries on EVERY tick, with no dwell

| field | value |
|---|---|
| **rework** | 🔴 **dirty** |
| **status** | open |
| **confidence** | 75% |
| **raised** | 2026-09-16, at i020 r006 nitpick.3 |
| **where** | `src/domain.operations/route/brain/applyStoneBrainOnEntry.ts:63-90` |

## .the fork, stated fairly

a stone parked on a **repairable** cause (`unenrolled`, `timed-out`) re-runs the whole apply on every
onStop tick — a `clone whoami` spawn capped at `WHOAMI_TIMEOUT_MS`, plus a fresh `clone say`
attempt — for as long as a human works that stone.

| the option | what it buys | what it costs |
|---|---|---|
| **retry every tick** — taken | the self-heal is immediate. a human runs `rhx enroll`, and the very next tick applies the brain with no further act | up to ~40% of the hook budget, per tick, indefinitely. 🟡 the probe cap and the budget both moved at the execution stone (2s/5s → 10s/25s); **the fraction is unchanged**, so this cost claim stands as written |
| **dwell** — skip the probe if the last attempt for this stone was under a few seconds ago | the same self-heal, one tick later at worst, at a fraction of the cost | a **timestamp on the entry marker** — so it ripples into `DriveBlockerState` and its snapshot |
| **breaker** — stop after N failures | the cheapest | 🔴 **rejected outright.** a breaker converts a repairable halt into a permanent one, and the human who fixes the cause gets no signal that a second act is now owed. that is the silent no-op the wish's own bound forbids |

## .what was taken, and why at the time

**retry every tick**, deliberately. `applyStoneBrainOnEntry` does not mark the entry on a failed
dispatch, so the next tick re-attempts. that is the direct read of the wish's bound — *"fail loud,
never a silent no-op"* — and it makes the repair path require exactly one human act (`rhx enroll`)
with no second act to resume.

## .why the rework is DIRTY

the dwell needs a **timestamp per stone**, and the only extant per-stone state is
`DriveBlockerState { count, stone }` — a persisted shape with its own writer, its own reader, and a
snapshot that pins it. to add a third field is a contract change on a record this feature did not
open, plus a resnap.

⇒ that is a ripple past the diff, so the two-question test (`rule.always.fix-forward-under-scouts-honor`)
returns **SAFE ✅ · CLEAN 🔴**, and the deferral is legitimate.

## 🔴 .why a FULCRUM was owed, and was absent until now

the dream was caught (`.dream/v2026_09_15.fix.stone-brain-undispatched-overload-and-retry-backoff.md`)
and the `.note` in the code states the tradeoff. **neither is a fulcrum**, and a dirt deferral owes
both:

| artifact | it records | so that |
|---|---|---|
| the **dream** | the *work* — the dwell's shape, and where | the next traveler builds it without me |
| the **fulcrum** | the *decision* — that I judged it dirty and chose to defer | 🔴 **the council can overrule the judgment** |

⇒ **a dream alone reports the work and hides the call.** the "dirty" grade above is my estimate of a
ripple, and an estimate made alone is exactly what a fulcrum list exists to surface.

⚠️ **this is the second instance of one class in this stone.** `F20` was raised for the identical
gap — a cost deferral with a dream and no fulcrum — one round earlier, and caught by a different
lane. **two occurrences make it a pattern**: when a deferral's reason is a COST rather than a SIZE,
the fulcrum is the artifact that gets skipped, because the `.note` in the code already feels like the
record.

## .the counter-case, stated fairly

the lane graded it a nitpick and conceded the design: *"the cost is honestly documented in a `.note`
and a dream is filed, so this is an accepted tradeoff."* and its own measurement is bounded —
*"up to ~40% per tick"*, which is a fraction of a budget, never an overrun of one.

🔴 **and there is a real argument the dwell is WRONG, not merely deferred.** a dwell adds a window in
which a repaired environment is knowably not applied. the cost it saves is a spawn the os schedules
cheaply; the cost it adds is a human who ran `rhx enroll`, saw no brain switch, and cannot tell a
dwell from a defect. ⇒ **that is the 25%, and it is why the confidence is not higher.**

## .the verdict, once ruled

_unrecorded — open._

## .see also

- `.dream/v2026_09_15.fix.stone-brain-undispatched-overload-and-retry-backoff.md` — the dwell's shape
- [`F20`](./inventory.of=fulcrums.case=F20-the-advisory-re-reads-the-guard-per-tick.md) — the same
  gap, one round earlier: a per-tick cost deferred with a dream and no fulcrum
- `rule.always.fix-forward-under-scouts-honor` — the SAFE/CLEAN test, and the clause that a dirt
  deferral owes both artifacts
