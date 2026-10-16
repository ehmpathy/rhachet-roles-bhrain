# fulcrum F43 — without `--focus pull`, two lanes narrow by the half of their rubric

- rework = **clean** — a guard edit, which is the driver's own lever
- status = 🟡 **BEST-GUESSED 2026-09-26 — option A**
- confidence = 🟡 **75%**
- raised.by = self, in the execution of seed S18

## .the fork

`mech-failhides` and `behavior-intent-coverage` ran `--focus pull` because under push they
overflowed (75.2% and 79.1% of the window at i010). S18 rules pull out on deepseek flash, so each
lane needs a narrower corpus under push.

### A — narrow by the half of the rubric each target set answers (taken)

| lane | rules | targets |
|---|---|---|
| `mech-failhides` | `code.prod/pitofsuccess.errors` | production source, no tests |
| `mech-failhides-tests` 🆕 | `code.test/pitofsuccess.errors` | test files only |
| `behavior-intent-coverage` | unchanged | test files only — the intent arrives as `--refs` |

the prod half is the corpus `mech-decode-friction` already fits at 52.8%.

### B — keep pull, name a tool-use brain on those two lanes

refused by S18 in spirit: the default brain is flash, and a lane that silently needs a premium
repl brain reprices the round and hides it in a guard flag.

### C — split by directory

keeps each rubric whole, and cuts the corpus at a line no rule draws. a failhide that spans two
directories reads as two halves, and neither half is the defect.

## 🟡 .why confidence is 75%

- `behavior-intent-coverage` no longer sees production source. a test that names a behavior the
  code never ships reads as coverage there. the arch and mech lanes read the production side, so
  the gap is covered in aggregate, never in one lane
- `mech-failhides-tests` is a new reviewer with a fresh budget — it adds a lane to every round
- the fit under push is predicted from sibling lanes, not measured. and `F41`'s unclamped
  `$conversation` rides in whole, so the next round measures the fit rather than this row

## .where

- `5.1.execution.from_vision.guard` — the three lanes above
