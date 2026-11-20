---
case: F17
rework: clean
ground: wrong
confidence: 0.85
status: open
owed: none
holds: []
lean: the ledger moves to .route/fulcrum.verdicts.jsonl, under the seal, as its own file
verdict: null
---

# F17 — the verdict ledger sits under the route seal, as its own file

## .the fork

the ledger that proves a human ruled lived in `.fulcrums/`, which the driver must write, so one
more `Write` forged a row. two homes close that:

- A: its own file, `.route/fulcrum.verdicts.jsonl`, beside `passage.jsonl` under the seal
- B: a `ruled` row in `passage.jsonl` itself, one ordered log for disputes, approvals, verdicts

## .taken, why

A. the seal is what closes the forgery, and both homes sit under it. B adds a status every reader
of the passage log must learn or skip, across the whole route domain, for a fact only the dispute
gate reads. A keeps that blast radius to the ledger's reader and writer, and the gitignore
allowlists it.

## .rework, why

clean. the ledger's dir is one constant at the two sites that join it; a move to B swaps the reader
and writer and leaves every gate's read of rows unchanged.

## .confidence, why

B orders a verdict against approvals for free. A orders it too, at the cost of two fields: each
row records `after` (the passage-log length at the verdict) and `held` (the dispute keys it ruled
over). an approval below `after` never answers the verdict, and a dispute absent from `held`
reopens it. the seal still guards only what the driver's own tools reach; a hand with a terminal
outside the agent is out of its scope. 85%.

known residue (r011 i009 nitpick.3): the seal matches path forms, so two forms pass it — a glob
such as `.r*/passage.jsonl` typed from inside the route, and `git checkout|restore|stash` over a
route path, which rewrites the tracked log with no `.route` token on the line. the cure is a hash
chain over the log (`.dream/v2026_11_18.feat.verdict-row-anchors-to-a-passage-hash.md`), never a
longer denylist.

## .where

`src/domain.operations/route/fulcrum/FULCRUM_VERDICT_LEDGER_NAME.ts` ·
`setFulcrumVerdictRow.ts` · `getAllFulcrumVerdictRowsOrDefect.ts` ·
`src/domain.operations/route/gitignore/findsertRouteGitignore.ts` ·
`src/domain.roles/driver/skills/route.mutate.guard.sh` (absolute paths and cp/mv/rhx write skills).

## .verdict

open. a design call; owes no dispute.
