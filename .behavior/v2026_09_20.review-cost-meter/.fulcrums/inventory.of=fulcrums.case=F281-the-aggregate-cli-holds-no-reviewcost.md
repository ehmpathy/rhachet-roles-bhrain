# F281 — the aggregate cli holds no reviewCost

- raised 2026-10-12, by `enroll-verif-snapshot-coverage` (nitpick.2), at 5.3 i006
- rework: **clean** — no change is owed
- status: 🟡 **BEST-GUESSED — disputed; the premise is false**
- confidence: **95%**

## .the fork, stated fairly

the lane read that `index.ts` gained a `reviewCost` export, and that the lazy-load contract test
never calls `cli.reviewCost()`.

| option | the claim |
|---|---|
| **A — dispute it** | the aggregate holds no `reviewCost`. there is no member to call |
| **B — concede, add a case** | a test for a member that does not exist |

## .taken, and why

**A.** `src/contract/cli/index.ts` reads, at lines 39–40:

```ts
// reviewCost and reviewWarmer are absent by design: each is reached only via its own
// subpath (`cli/review._.cost`, `cli/review._.warmer`)
```

the lazy-import contract is kept by the absence itself (`rule.require.isolated-cli-subpath-exports`).

## .rework, and why

**clean.** naught to change.

## .confidence, and why it is not higher

it is as high as it reads.

## .where

`src/contract/cli/index.ts`

## .verdict

— (awaits the council)
