# domain.term: route.guard.brain.dispatch.claim

term.chosen   = claim
term.kind     = noun
term.boundary = route.guard.brain.dispatch   # a reservation that ONE dispatch is in flight
term.synonyms.forbidden:
- lock
- flag
- marker
- token
- sentinel

## .what

a **route.guard.brain.dispatch.claim** is an on-disk reservation that one brain switch is in flight
for one stone. a peer that reads a LIVE claim stands down rather than dispatch a second.

- advisory — honored by convention; it makes a second dispatch unlikely, never impossible
- it expires on its own — LIVE while its mtime is within 15s, the child's own submit-verify
  lifetime
- no holder identity, no reaper — which is what parts it from the drive-state lock

🟡 a kill between claim and dispatch costs up to 15s of silence — an accepted limitation
- the claim is written inside the state lock; the dispatch runs outside it
- a process killed between the two leaves a fresh claim, so peers stand down and no line renders
- the mtime expiry is the recovery — `blackbox/driver.route.brain.acceptance.test.ts`

## .refs

- src/domain.operations/route/brain/BrainDispatchClaim.ts           # the declared shape
- src/domain.operations/route/brain/genBrainDispatchClaim.ts        # findserts one
- src/domain.operations/route/brain/delBrainDispatchClaim.ts        # releases one
- src/domain.operations/route/brain/applyStoneBrainOnEntry.ts       # writes it, then dispatches

## .reason

- `term=route.guard.brain.dispatch.claim._.choice.reason.md` — the `lock` and `marker` disputes,
  the lock-vs-claim table, why 15s
