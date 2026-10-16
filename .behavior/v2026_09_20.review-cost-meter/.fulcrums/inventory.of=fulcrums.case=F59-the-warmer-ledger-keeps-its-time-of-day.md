# F59 — the warmer ledger keeps its time of day

## .the fork

`WarmerPokeRow.at` is an iso instant with time precision, written to `warmer.pokes.jsonl`.
`rule.forbid.timestamps-in-route-artifacts` forbids time precision in a route artifact.

| option | what it does |
|---|---|
| **A — keep the instant** | the ledger is a machine log, never a route artifact; the rule does not reach it |
| B — date only | cut `at` to `YYYY-MM-DD` |
| C — drop `at` | recover chronology from the run dir name alone |

## .taken — A, and why

- **the file is not a route artifact.** it lives under `.log/bhrain/review/<run>/`, which
  `.gitignore` excludes (`*.log`, confirmed by `git check-ignore`). the rule's three harms —
  false precision in a committed record, merge conflicts, noisy diffs — each need a commit. a
  gitignored log incurs none of them
- **the time of day IS the payload.** a warmer pokes every few minutes, so several rows share
  one date. a date-only `at` makes rows of one run indistinguishable in time, and the ledger's
  whole reader is a driver who `cat`s it mid-flight to ask whether a spender is live now
  (`0.wish` bar 9b). a stale row read as current is the failure that reader must avoid
- **the log dir name already carries an iso instant** (`genLogDirName`), so the review log tree
  holds time precision by design throughout; one row field is not a new precedent

## .rework

clean — one field, one writer (`setReviewWarmerPokes`), no reader consumes `row.at`.

## .confidence

80%. the 20% is whether the wisher reads `.log/` review trees as "route-related persistence"
in the rule's spirit; if so, B is a one-line change.

## .where

`src/domain.operations/review/warmer/setReviewWarmerPokes.ts` (`WarmerPokeRow.at`).

## .verdict

🟡 BEST-GUESSED 2026-09-27 — option A. disputed on the i013 `repo-rules-review-ops-meter` lane.
