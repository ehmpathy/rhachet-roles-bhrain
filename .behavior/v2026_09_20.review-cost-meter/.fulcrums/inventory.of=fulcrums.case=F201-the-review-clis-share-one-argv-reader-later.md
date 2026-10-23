# F201 — the review clis share one argv reader, in a later round

- raised 2026-10-09, from i034 r030 nitpick.1 `[nitpick][better]`: `review.ts`, `review.by.ts`, and
  `review._.cost.ts` each carry their own unknown / stray / repeated / valueless checks, by three
  methods, and they disagree on whether a dash-led token is a value
- rework: 🔴 dirty
- status: 🟡 **BEST-GUESSED — deferred; overrule it to extract the reader now**
- confidence: **70%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — one spec-driven reader now** | `src/domain.operations/cli/`, a per-command spec, one implementation, the divergences gone |
| **B — after this route** | three published cli contracts, each with snapshotted refusals; a shared reader re-decides each divergence, so each command's refusal copy moves |

## .taken, and why

**B.** the reviewer is right that the copies drift, and the dispatcher flag set was already lifted
for that reason. but each divergence is a contract decision (is `--limit -5` a value?), and the
extraction changes the refusal surface of three commands at once, past this route's scope.

## .rework, and why

**dirty.** three clis' refusal snapshots and the acceptance cases that pin them move together.

## .confidence, and why it is not higher

a fourth review cli would make A overdue.

## .where

`src/contract/cli/review.ts:266-440` · `review.by.ts:65-131` · `review._.cost.ts:326-626` ·
`src/domain.operations/cli/`

## .verdict

(open)
