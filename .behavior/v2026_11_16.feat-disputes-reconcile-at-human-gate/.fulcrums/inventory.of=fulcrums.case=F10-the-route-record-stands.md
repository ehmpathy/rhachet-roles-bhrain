---
case: F10
rework: clean
ground: dirty
confidence: 0.80
status: open
owed: human
holds: [behavior-intent-coverage/i001/blocker.4, behavior-intent-coverage/i001/nitpick.3, behavior-intent-coverage/i002/blocker.1, behavior-intent-coverage/i002/nitpick.3]
lean: the approved vision stays as approved; the fulcrum entries F1–F7 exist and ship with the route
verdict: null
---

# F10 — the route's record stands as approved

## .the fork

two concerns grade the route's own record, not its code:

- blocker.4 reads the fulcrum summary as rows with no entry files behind F1–F7
- nitpick.3 asks the vision to be amended, since it sketched verdict provenance as PassageReport
  rows and the code writes a dedicated ledger

- A: hold both. each of F1–F7 has its entry file in `.fulcrums/`; they were untracked at i001, so
  the reviewer's diff did not show them. the vision is an approved stone; the yield's caveat names
  the ledger and why
- B: amend the vision to match the code

## .taken, why

A. blocker.4 is a misread of an untracked file, and the entries ship with the PR. for nitpick.3, a
vision amended after approval reopens a stone the director already passed; the drift is recorded
where the commander reads it, in the 5.1 yield caveats and in F11.

## .rework, why

clean. a vision edit is one paragraph, if the human prefers B.

## .confidence, why low

blocker.4 is sure. nitpick.3 is a judgment on whether an approved artifact should track later
design calls. 80%.

at i002 the same two concerns return as blocker.1 and nitpick.3. blocker.1 has a cause beside the
untracked files: the review's polluter filter drops `inventory.of=fulcrums.case=*` entries from
the scope and keeps the summary, so a reviewer sees rows with no entries behind them. the evidence
is the run's `input.scope.debug.json` (`targetFilesDropped`). that defect is caught as a dream.

## .where

`.fulcrums/inventory.of=fulcrums.case=F*.md` · `1.vision.md` · `5.1.execution.from_vision.yield.md`.

## .verdict

open. owed to the human at the PR.
