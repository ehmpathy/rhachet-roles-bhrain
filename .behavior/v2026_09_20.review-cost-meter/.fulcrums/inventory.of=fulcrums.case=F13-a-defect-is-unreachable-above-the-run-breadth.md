# F13 — a run's `defect` is unreachable above the `run` breadth

- **rework** = clean
- **status** = OPEN — half repaired, half deferred, the deferral is the fork
- **confidence** = **90%** that the split is right · 🔴 **50%** that the deferred half belongs
  to this branch at all
- **raised** = 2026-09-22, from `enroll-impl-behavior-intent` i014 (finding 1)

## .the fork, stated fairly

`run.defect` names the file at fault and why it could not be read. it was computed, stored,
asserted in data, and read by **no renderer at any breadth**.

the `run` breadth half is repaired this round. the question this row reserves is what to do
about the other two:

| option | what it costs | what it buys |
|---|---|---|
| **A — as shipped** | naught | `--of run` names the cause. tree and grove keep a count with no route |
| **B — carry `defects` on the report root** | a change to `ReviewMeterReport`, read by three renderers and two `--json` payloads, plus tree + grove snapshots | every breadth names the cause once |
| **C — give `--of run` an `--at <run-dir>`** | a cli surface change | any run addressable by name; also closes `F10`'s `--at` neighbour |

## .taken, and why AT THE TIME

**option A**, and the deferred half is caught as a dream with option B scoped.

the SAFE/CLEAN test decided it (`rule.always.fix-forward-under-scouts-honor`):

- the `run` half is **safe and clean** — one renderer, one test file, and the breadth whose
  single row IS the report, so a dropped cause is the whole answer lost. ⇒ **fix now**, and it
  was fixed, with its clamp proven red
- the tree/grove half is **safe and NOT clean** — `ReviewMeterReport` is a contract three
  renderers read. ⇒ **defer, with a dream and this row**

🔴 **and the cheap middle was examined and REFUSED**, which is the part worth the record. a
hint that aims the caveat at `--of run`—

```
⚠️ +2 unmetered — see `rhx review._.cost --of run` for the cause
```

—is one line and **wrong for every corrupt run that is not the latest**, because `--of run`
reads `getOneReviewRunMeterLatest`. a driver whose defect sits three rounds back would run it,
see a healthy row, and conclude the defect was gone.

⇒ that is the exact shape `[case7] [t2]` clamps one branch over. **a hint that answers a
different question reads as a fix and is a redirect** — so the cheap option is worse than the
gap it closes, and A is a deliberate hold rather than an absent effort.

## 🔴 .why confidence on the deferred half is only 50%

the argument **against** doing it here is not merely cost, and it deserves to be stated as well
as the argument for:

- `ReviewMeterReport`'s four fields are all **folds**. `defects` would be the first field that
  is a **list of rows**, so the shape stops being "a report of buckets" and becomes "buckets
  plus an escape hatch". that is a real coherence cost, not a diff-size one
- and option **C** may be the better answer to the same need — it makes any run addressable,
  which is a capability rather than a patch, and it settles `F10`'s `--at` polysemy in the same
  ruling
- ⇒ so a driver who shipped B here might well be **building the wrong thing quickly**

that uncertainty is precisely why this is a row rather than a guess acted on.

## .rework, and why it is CLEAN

no caller is hardened against option A. the `run` renderer's defect line is additive; the tree
and grove renderers are untouched, so neither B nor C has to undo work. a later round picks
either without a teardown.

## .where

- `src/domain.operations/review/meter/genReviewRunStdout.ts` — the repaired half
- `src/domain.operations/review/meter/genReviewMeterReport.ts` — the contract that drops the runs
- `src/domain.operations/review/meter/genReviewMeterStdout.ts:52` — `asUnmeteredCaveat`, the
  count with no route
- `.dream/v2026_09_22.fix.a-runs-defect-string-is-unreachable-at-tree-and-grove.md` — option B,
  scoped

## .the verdict, once ruled

_(open — the wisher's)_
