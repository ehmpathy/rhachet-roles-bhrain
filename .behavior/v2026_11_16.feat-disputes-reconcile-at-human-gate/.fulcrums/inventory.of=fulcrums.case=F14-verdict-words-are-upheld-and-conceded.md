---
case: F14
rework: dirty
ground: dirty
confidence: 0.60
status: open
owed: human
holds: [enroll-impl-behavior-intent/i004/blocker.3]
lean: the lever ships upheld | conceded; a rename is the human's call, and a rename after release breaks every caller
verdict: null
---

# F14 — the lever's verdict words are `upheld | conceded`

## .the fork

F2 settled the lever, `rhx route.fulcrum.rule`, and left its `--as` words for a blueprint stone.
F7 removed that stone. so the words shipped without a settlement.

- A: `upheld | conceded` — the pair as shipped
- B: a word for the human's concede that `route.stone.set --as conceded` does not already hold,
  e.g. `upheld | overturned`, or `upheld | reversed`

## .taken, why

A. the two verbs sit on different commands and different subjects: `route.stone.set --as conceded`
is the driver's concession on one concern; `route.fulcrum.rule --as conceded` is the human's verdict
on one fulcrum. the command and the `--case` flag part the two at every call site. but the overload
F2 named is real, so the call is the human's.

## .rework, why

dirty once released. the words are a public cli contract, written into every ledger row and every
frontmatter `verdict`. a rename after release needs a migration of both and a deprecation alias.
before release it is a rename in one closed set.

## .confidence, why low

F2's own `.taken` called `conceded` ambiguous on a stone verb. A keeps that word on a peer verb.
60%.

## .where

`src/domain.operations/route/fulcrum/asFulcrumFrontmatter.ts` (`FULCRUM_VERDICTS`) ·
`src/contract/cli/route.ts` (`route.fulcrum.rule`) · `.fulcrums/inventory.of=fulcrums.case=F2-human-verdict-lever.md`.

## .verdict

open. owed to the human at the PR.
