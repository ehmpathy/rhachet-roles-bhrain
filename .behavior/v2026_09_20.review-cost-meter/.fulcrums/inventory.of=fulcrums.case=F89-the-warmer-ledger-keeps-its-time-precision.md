# F89 — the warmer poke ledger keeps its time-precision `at`

## .the fork, stated fairly

`rule.forbid.timestamps-in-route-artifacts` forbids a time-precision field in a route artifact;
dates (`YYYY-MM-DD`) are fine. the warmer writes `at: <iso instant>` on every row of
`warmer.pokes.jsonl`, the retire row among them.

| option | what it costs |
|---|---|
| **A — keep the iso instant** (taken) | the field carries time precision, against the rule's letter |
| B — cut to a date | the lapse test can no longer run, see below |
| C — drop `at`, order by file mtime | one mtime per FILE, never per ROW; the last-poke instant is lost |

## .taken, and why, at the time

**A.** the rule governs **route artifacts** — committed files under `.behavior/`, where a timestamp
means false precision, merge conflicts, and noisy diffs. the ledger is none of those:

- it lives under `.log/bhrain/review/<rundir>/`, which is git-ignored. it is never committed,
  never merged, never diffed in review. the rule's whole `.why` does not reach it
- its time precision is **load-bearing, not decorative**. `getOneWarmerValue.isWarmerReachPassed`
  reads the last row's `at` and asks whether `MINUTES_OF_CACHE_REACH` (66 minutes) has passed since
  it. a date would make every warmer lapse at midnight, or never — the verdict `did it pay for
  itself?` would be noise
- the run log dir it sits in is itself named by an iso instant; the corpus is keyed on time by
  construction

⇒ the precision is the measurement. B destroys the feature; C cannot express a per-row instant.

### the mtime counter, weighed 2026-10-05

`repo-rules-review-ops-meter` (i003.bf5cc) argued C after all: the one reader reads only the LAST
row's `at`, and the file's mtime is that same instant. true on a live disk, and still not taken:

- the reader is tested under an INJECTED clock (`WarmerClock`). the lapse suites write rows at a
  fake `now` 66 minutes apart (`setReviewWarmerPokes.integration.test.ts` asserts
  `rows[1]?.at` equals the injected stamp, to the millisecond); an mtime follows the wall, never the injected
  clock, so the lapse verdict would become untestable without a real 66-minute wait
- an mtime is a property of the copy, not of the record: a `cp`, an archive, or a restore moves it,
  and a ledger moved between machines would then report its warmer as freshly awake
- the rule's own scope names `.route/` runtime markers; the ledger sits under `.log/`, the run's
  diagnostic dir, beside its other iso-named artifacts

## .rework

**clean.** should a council rule the ledger a route artifact after all, the instant stays and no
file moves — the lapse test needs it either way. the one real alternative is a per-row relative
offset from the dir's own stamp, a local change to one writer and one reader.

## .confidence — 92%, and why it is under 93

the rule's `.enforcement` line reads *"timestamp fields in route artifacts"*, and *route artifact* is
not defined in a glossary cluster. a reader could argue every file a route's review writes is one.
the ignore rule and the rule's own `.why` both say otherwise, but the boundary is not written down.

## .where

- `src/contract/cli/review._.warmer.ts` (the retire row)
- `src/domain.operations/review/warmer/setOneWarmerPokeRow.ts` (every row)
- `src/domain.operations/review/getOneWarmerValue.ts` — `isWarmerReachPassed`, the reader

## .verdict

open — raised by `r001.repo-rules` at i061 nitpick.2; disputed, for the council.

- 2026-10-06 — re-raised at i008 (`88cf25d6c81772fdc0`) by `r001.repo-rules` as **blocker.1**, now
  on the rule's `.exception` clause (*"use git commit timestamps or file system mtime — don't embed
  in the data"*). the lane grants the `.why` does not reach the ledger and holds the letter. answered
  in the i008 `.taken`: one mtime per file cannot carry a per-row instant in an append-only multi-row
  log, nor an injected clock; and the clause's own premise (a route artifact) is the open boundary
  this fulcrum reserves. still disputed, still for the council — the lane asked for exactly this
  record.
- 2026-10-07 — re-raised at i013 (`68dd6daa0d37eeb7d2`) by `r016.repo-rules-review-ops-meter`, with
  three points. answered in the i013 `.taken`:
  1. *"route-related persistence" reaches a file a route's review writes.* that read makes every
     `.log/` artifact a route artifact, the run dir named by its own iso instant among them — a
     scope the rule's `.why` (merge conflicts, noisy diffs) cannot reach, since `.log/` is never
     committed. the boundary is the open question this fulcrum reserves for the council
  2. *the field is a machine input, so the `.exception` routes it to mtime.* the exception names
     mtime as the cure for a timestamp a route artifact would otherwise embed; it presumes the
     artifact is in scope. and mtime cannot carry what the reader needs where it matters: a ledger
     copied, archived, or restored carries the copy's mtime, so a moved ledger reports its warmer
     freshly awake — a wrong cold/warm grade, the correctness case the exception exists to protect
  3. *the reader reads only the last row, which mtime equals.* on a live disk, at the moment of the
     write. the retire row and the poke row are written by different processes (the CLI and the
     loop), and `review._.cost` reads the ledger later; any touch between (a plain `cp` aside, an
     editor save) moves mtime and leaves the row as written. one injected `WarmerClock` drives every
     row the lapse suites assert on; an mtime follows the wall alone
  the peer `ReviewWarmerRecord` under `.agent/.cache/` is a process store, not a route artifact by
  any read of the rule. still disputed, for the council.
- 2026-10-07 — re-raised at i016 (`31f2ba409ea651c2e8`) by `r016.repo-rules-review-ops-meter`, now
  graded a nitpick by the lane itself, which names the scope boundary "genuinely arguable" and
  offers a council verdict as one of three settlements. no new point beyond the i013 three; the
  lane's own third option is exactly what this fulcrum reserves. still disputed, for the council.
- 2026-10-07 — re-raised at i017 (`c0dcbd0db9103760c0`) by `r016.repo-rules-review-ops-meter`
  nitpick.1, with the i013 points restated: the `.scope` phrase "any route-related persistence",
  and the `.exception`'s mtime cure for a machine input. no new point; each is answered in the
  i013 line above. the lane again files it a nitpick and names a council verdict on the
  `.log/bhrain/review/` and `.agent/.cache/` scope as a settlement, which is what this fulcrum
  reserves. still disputed, for the council.
