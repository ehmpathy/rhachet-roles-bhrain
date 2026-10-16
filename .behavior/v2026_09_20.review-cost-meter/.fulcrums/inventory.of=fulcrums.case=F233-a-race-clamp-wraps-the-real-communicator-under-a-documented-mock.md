# F233 — a race clamp wraps the real communicator under a documented mock

- raised 2026-10-12, by `mech-test-scope-purity` (blocker.6), at 5.3 i003
- rework: **clean** — an injected enumerator seam would retire the wrap in one round
- status: 🟡 **BEST-GUESSED — disputed**
- confidence: **80%**

## .the fork, stated fairly

two integration suites clamp a race with `jest.mock`:
`runStoneGuardJudges.casePriorOrder` (the order in which judge reads complete) and
`getOneStoneJudgeInputHash.caseVanished` (a file deleted between list and read).

| option | the claim |
|---|---|
| **A — keep the documented wrap** | each factory calls `jest.requireActual`, so the real read and the real glob run over real files. only WHEN a read completes, or a real delete between list and read, is chosen. a race cannot be summoned on demand, so the exception is unavoidable by nature. each file carries the full `.mock/.why/.real` docblock |
| **B — inject a seam** | `rule.forbid.integration.mocks` forbids `jest.mock`; give the operation an injected enumerator and pass a racy one |

## .taken, and why

**A.** the rule's exception list names examples, not a closed set. its test is whether the
circumstance is unavoidable and documented, and both hold. option B changes the contracts of two
production communicators to serve a test, and no shipped harm asks for that.

## .rework, and why

**clean.** where a later round makes the enumerator an injected dependency for its own reasons,
the wrap retires in that round with no other change.

## .confidence, and why it is not higher

a strict reader holds that any `jest.mock` in an integration suite is a defect, however real the
wrapped call stays.

## .where

`src/domain.operations/route/judges/runStoneGuardJudges.casePriorOrder.integration.test.ts` ·
`src/domain.operations/route/judges/getOneStoneJudgeInputHash.caseVanished.integration.test.ts`

## .verdict

— (awaits the council)
