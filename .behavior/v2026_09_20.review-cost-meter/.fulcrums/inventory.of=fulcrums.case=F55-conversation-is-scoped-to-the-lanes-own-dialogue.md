# fulcrum F55 — `$conversation` is scoped to the lane's own dialogue

- rework = clean — one optional input and one filter; revert = drop `slug:` at the one call site
- status = 🟡 **BEST-GUESSED 2026-09-26 — option A, own lane only**
- confidence = 🟡 **85%**
- raised.by = the driver, from i007's measured timeouts

## .the fork

`$conversation` expands to the prior peer dialogue a lane reads. before this, it held every lane's
givens, reports, and takens from every prior round.

measured at i007 on this stone's 20-lane guard (`mech-failhides`, `metrics.compiled.json`):
`conversation` = 1,524,902 chars across 387 files, 77% of the prompt, in the uncacheable tail. nine
l1 lanes timed out at 10 minutes with 29 to 61 targets each. the i006 target split did not move it.

### A — each lane reads only its own dialogue (taken)

its own given, its own detailed report, and the driver's taken to it. that is the whole input a
reviewer needs to judge convergence on its own critique.

### B — keep the union, cap it by depth (the last N rounds)

bounds growth in rounds, not in lanes. a 20-lane guard still ships 19 lanes of foreign dialogue into
each prompt, and each lane pays for text it never grades.

### C — keep the union as it was

the prompt grows as lanes × rounds. on a guard of this size it passes the provider timeout by round
6 or 7, so a long route stalls on dialogue no rubric reads.

## 🟡 .why 85%, not higher

- a lane loses sight of a neighbour's settlement. if the driver answered a concern in lane X that
  lane Y also raises, Y no longer sees X's answer, and the driver writes it twice. the repair is
  cheap (a taken per lane is already owed), so the cost is a duplicated paragraph, never a stall
- the enroll lanes' prompts say "read the prior peer-review conversation". a broad-scope reviewer
  may have used the union for context. its own lane's dialogue still carries every point it raised

## .where

- `src/domain.operations/route/guard/review/peer/enumRouteGuardReviewPeerConversationFiles.ts`
- `src/domain.operations/route/guard/review/runStoneGuardReviews.ts` (the one call site)
- clamps: `enumRouteGuardReviewPeerConversationFiles.test.ts [case9]`,
  `runStoneGuardReviews.integration.test.ts [case33]`
