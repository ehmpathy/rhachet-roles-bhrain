# rule.forbid.inject-same-repo-domain-ops

## .what

dependency injection is for **external** dependencies and **parameterized**
dependencies only. never inject same-repo domain operations — compose those via
direct import.

## .why

DI exists to make the **boundary with the outside world** swappable/testable and
to let **callers parameterize behavior**. that is its entire value. injection of a
repo's own domain functions buys zero test seam (no external dependency to fake),
adds a wide `context` contract + boilerplate at every call site, and defeats the
"orchestrator reads as narrative" goal.

incident: an `arch-opport-decomposition` reviewer raised a blocker that demanded a
`stepRoute*` orchestrator inject its own leaf ops (`getAllStones`,
`asStatusLine`, `computeNextStones`, …) via context. this was rejected — "that is
defo not a pattern we want." every orchestrator in `src/contract/cli/route.ts`
imports its same-repo leaves directly; that is the correct, established pattern.

## .the three-way split

| kind | how | examples |
|------|-----|----------|
| **external** dependency (I/O boundary) | inject via `context` | SDKs, DAOs, service clients, `log`, `clock`/`now`, `uuid`, random, env readers, `context.brain`, db/queue/fs adapters |
| **parameterized** dependency (caller's choice) | inject via `options` | format/mode/precision flags, feature toggles, a strategy fn the caller supplies |
| **same-repo domain** operation | import directly — do NOT inject | transformers (`as*`/`is*`/`compute*`), other orchestrators, same-repo leaf ops |

## .the heuristic

"is there a real, external dependency a test would need to fake?"

- yes → inject it (`context`)
- no, but the caller picks it → `options`
- no, it's just our own domain code → **import it**

## .the tell that DI has gone too far

if a proposed `context` lists this repo's own `get*`/`compute*`/`as*` functions,
DI has been misapplied. those are composition, not dependencies. a DI blocker
against same-repo domain composition is the defect — not the code.

## .enforcement

- injection of same-repo domain ops via context = **over-injection** (avoid)
- a DI blocker against same-repo domain composition = a false positive

## .see also

- `.behavior/v2026_07_08.fix-status-line/handoff.[to=ehmpathy.architect].dependency-injection-boundary.md`
  — handoff that proposes this boundary be added to the ehmpathy DI brief
- `src/contract/cli/route.ts` — the established pattern: orchestrators import same-repo leaves
