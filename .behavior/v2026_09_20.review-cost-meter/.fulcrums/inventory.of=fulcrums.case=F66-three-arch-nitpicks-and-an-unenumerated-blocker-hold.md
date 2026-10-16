# fulcrum F66 — three arch nitpicks and an unenumerated blocker hold

- rework = 🟢 **clean** — each held concern is a lift, a split, or a documented exit code a later round can land alone
- status = 🟡 **BEST-GUESSED 2026-09-28 — fix r025's blocker and nitpick; hold four, each by name**
- confidence = 🟡 **75%**
- raised.by = peer lanes at level 3, i018: `enroll-impl-behavior-intent-review-ops` r025 (tallied 2 blockers, 1 nitpick) · `enroll-impl-arch-defects` r026 (0 blockers, 3 nitpicks)

## .the fork

r025's one enumerated blocker (the overflow refusal ran under no test) and its nitpick (a
`└─ scope` header over an empty subtree) were fixed in code: `emitReviewOverflowRefusal.test.ts`
and `genReviewHeaderStdout.test.ts` now exercise both, snapshot included. four concerns remain.

| option | cost |
|---|---|
| **A** — land all four this round | a contract change to an argv parser shared by other skills; a split of a 1,154-line orchestrator that predates the wish; an exit-code change on a published cli |
| **B** — hold four, disputed by name | each hold is a judgment, hence this row |

## .per concern

| lane | concern | disposition | why |
|---|---|---|---|
| r025 | blocker.2 — tallied, never enumerated | 🟡 **disputed** | the given's body names `blocker.1` alone; its final count reads `2 blockers`. there is no second concern to repair or refute, so a concession would claim a concern nobody named (`rule.forbid.suppression-of-undeclared-concerns`, the over-claim row) |
| r026 | nitpick.1 — `isNodeEvalMode` twice, in `review.ts` and `review.by.ts` | 🟡 **disputed** | both copies stand identical on `main`. the shared `domain.operations/cli/isNodeEvalMode` reads a bare positional as eval mode; these two read it as an entrypoint. a lift must pick one of two semantics, which changes either `rhx review`'s argv or every skill that uses `getInvocationArgs` — a parser contract call, not a tidy move |
| r026 | nitpick.2 — `setStoneAsPassed` is long and repeats its tail | 🟡 **disputed** | 1,154 lines and 4 `computeGuardData(` tails on `main`; 4 tails at `HEAD`. the shape predates the wish; a split of the passage orchestrator is its own behavior |
| r026 | nitpick.3 — `review.by` exits 1 on usage, siblings exit 2 | 🟡 **disputed** | `review.by` on `main` already reserves 2 for "a rubric found blockers", and a route guard reads that code. to move it re-keys every guard that dispatches `review.by`; the reviewer names the choice documented |

## .the verdict

open — for the council.
