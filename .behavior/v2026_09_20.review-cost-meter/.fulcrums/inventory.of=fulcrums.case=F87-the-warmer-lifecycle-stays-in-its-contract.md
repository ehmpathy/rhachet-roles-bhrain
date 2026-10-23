# F87 — the warmer child's lifecycle stays in its contract this round

- rework = 🟠 **dirty** — a new domain orchestrator with an outcome union, the contract cut to argv + exit, and the warmer acceptance suites re-proven against a live brain
- confidence = 🟡 **75%**
- raised.by = `enroll-impl-arch-defects` at i057, nitpick.2

## .the fork

`reviewWarmer` in `src/contract/cli/review._.warmer.ts` does more than read argv. it runs the whole
child lifecycle in order: the tether check, the lane claim, the brain pin and build, the boot-fault
ledger row, the pokes, and the release in `finally`. the order rules that matter live in contract
code, so no domain test reaches them without a spawn.

| option | what it costs |
|---|---|
| A — lift the body into `warmer/runReviewWarmer`, which returns `{ outcome, fault }`; the contract keeps argv, refusal output, and `process.exit` | a new orchestrator and its integration test, the contract rewritten around it, and the three warmer acceptance suites re-run against a live brain to prove the lift |
| B — keep the lifecycle in the contract, defer A to a dream | the order rules stay testable only through a spawn until the dream lands |

## .taken — B

- each step the lifecycle calls is already a named domain operation with its own test
  (`getOneWarmerTetherVerdict`, `setReviewWarmerHandoff`, `setReviewWarmerPokes`,
  `delReviewWarmerLockIfOurs`); what the contract owns is their order
- the child has one entry today (`rhx review` spawns it), so no second caller copies the sequence
- the proof the lift needs is the warmer acceptance suites, and the brain they call sits behind the
  suspended account `F84` defers. a lift that cannot be proven this round is a lift shipped on faith
- the work is caught: `dreams/v2026_10_03.refactor.warmer-lifecycle-lifts-into-a-domain-orchestrator.md`

## .why confidence is not higher

`review.ts` already splits its own contract from `stepReview`, so the target shape has precedent,
and the argv half of this split landed this round (`asWarmerArgv`). a reader may hold that the
order rules are the part most worth a domain test, and the part most likely to drift.

## .verdict

🟡 BEST-GUESSED 2026-10-03 — defer to the dream.
