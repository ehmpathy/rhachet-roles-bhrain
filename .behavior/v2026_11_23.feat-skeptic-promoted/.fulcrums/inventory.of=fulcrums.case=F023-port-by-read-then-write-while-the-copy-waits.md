# F023 — port by read-then-write while the copy waits

## .the fork

the human ordered the source copied via `rhx cpsafe`. cpsafe refuses any source outside the repo (`source must be within the git repository`, run 2026-11-24, four times), and the raw `cp` was declined. so:

- (a) halt until the human picks how the copy lands
- (b) port on: read each source file, write it transformed into `src/domain.roles/skeptic/`; take the copy as an in-repo baseline when it lands

## .taken

(b). the port transforms nearly every file (fold, mins, vocabulary, quotes), so a byte copy is a baseline for diffs, not the deliverable. the human holds three options (stage it by hand, approve the raw cp once, or drop the copy); each one composes with (b).

## .rework

clean. a staged copy at `.temp/role=skeptic.source/` adds a diff baseline; no file written by (b) changes.

## .confidence

80%. why low: the human may have wanted the copy as the FIRST state of `src/domain.roles/skeptic/` in git history, so the diff of each transform reads in review. if so, a commit of the raw copy before the transforms would be owed, and (b) has already written six files there.

## .where

`5.1.execution.from_vision.yield.md` todo 1.

## .verdict

open — the human's pick.
