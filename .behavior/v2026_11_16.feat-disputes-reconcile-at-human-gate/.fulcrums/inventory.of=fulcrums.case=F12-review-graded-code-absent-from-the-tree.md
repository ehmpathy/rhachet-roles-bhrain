---
case: F12
rework: clean
ground: wrong
confidence: 0.97
status: open
owed: reflect
reflect: ehmpathy/rhachet-roles-bhrain#804
holds: [arch-hazards-behavior/i002/blocker.2, arch-hazards-behavior/i002/blocker.3, arch-hazards-behavior/i002/nitpick.1, arch-hazards-behavior/i002/nitpick.2]
lean: no repair; the code these four concerns grade is not in this tree
verdict: null
---

# F12 — four concerns grade code absent from the reviewed tree

## .the fork

`arch-hazards-behavior` i002 raised four concerns against files that do not exist here:

- blocker.2 — `src/domain.operations/invitations/createInvitation.ts`
- blocker.3 — `src/domain.operations/orders/getOrderTotals.ts`
- nitpick.1 — `src/domain.objects/Order.ts`
- nitpick.2 — `src/domain.operations/orders/calcOrderStats.test.ts`

- A: dispute each as a sure misread, and reflect the lane defect upstream
- B: concede each, which claims four repairs to code that is not here

## .taken, why

A. a glob over each cited path returns 0 files; this route adds no invitation or order code. to
concede would put four false repairs on record.

## .rework, why

clean. no code changes either way.

## .confidence, why

97%. the evidence is a file-system fact, not a judgment. the 3% is for a cited path that might name
code under another root, and a repo-wide search for each cited symbol found none.

## .where

`.reviews/peer/5.1.execution.from_vision._.review.i002.…r007._.given.by_peer.arch-hazards-behavior.report.md` ·
the `.taken.by_self.arch-hazards-behavior.md` beside it.

## .verdict

none owed to a human: ground wrong at 0.97 derives `owed: reflect`. the lane defect is filed as
ehmpathy/rhachet-roles-bhrain#804.
