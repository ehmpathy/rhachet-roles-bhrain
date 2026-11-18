---
case: F9
rework: clean
ground: dirty
confidence: 0.75
status: open
owed: human
holds: [arch-opport-decomposition/i001/nitpick.1, arch-hazards-maintenance/i001/blocker.3, arch-hazards-behavior/i001/nitpick.3, mech-failhides/i002/nitpick.1]
lean: follow the repo's extant assert* prefix and optional-flag shape; a class-wide change belongs to its own route
verdict: null
---

# F9 — the repo's extant conventions are kept, not reformed here

## .the fork

two conventions in the new code draw concerns:

- the `assert*` prefix (`assertRouteFulcrumDisputesRuled`, `assertRouteGatelessLastStoneDisputesRuled`,
  `assertFulcrumFitsDispute`) sits outside the sanctioned get/set/gen/del + as/is prefixes
- `reflect?: string` is an optional field on an internal input, where the rule asks for `| null`
- the `route.fulcrum.rule` argv refusals carry no metadata bag. `asConstraintErrorHeader` renders
  every bag field, so the repo's convention is a bag of addresses only, never an echo of the
  caller's own flags; each bag the reviewer suggests (`{ as }`, `{ case }`) echoes a flag the
  message already states

- A: match the extant code; `assertFulcrumPathExists` and its peers already use `assert*`, and the
  dispute path's other optional flags (`why?`, `severity?`) thread from the cli the same way
- B: rename to a sanctioned prefix and make `reflect` nullable here, apart from the rest of the class

## .taken, why

A. B renames three operations and one field while their siblings keep the old shape, so a reader
meets two conventions side by side. the honest repair is class-wide: every `assert*` operation and
every optional flag across ~30 call sites, in one route of its own.

## .rework, why

clean. a rename is mechanical, and a class-wide sweep would carry these three with the rest.

## .confidence, why low

the rules are clear, and "the neighbours do it too" is a weak defense. but a partial reform is worse
than a consistent extant set. 75%.

## .where

`src/domain.operations/route/fulcrum/assert*.ts` · `src/domain.operations/route/stones/setStoneAsConcernAbsorbed.ts`.

## .verdict

open. owed to the human at the PR.
