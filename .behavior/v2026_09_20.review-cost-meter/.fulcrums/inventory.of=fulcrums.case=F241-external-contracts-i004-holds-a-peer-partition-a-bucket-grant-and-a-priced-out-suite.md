# F241 — the external-contracts i004 holds: a peer partition, a bucket grant, a priced-out suite

- raised 2026-10-12, by `mech-external-contracts` (blocker.1, blocker.2, blocker.3, blocker.4,
  nitpick.1), at 5.3 i004
- rework: **clean** — each cure is an added test or a lifted `.skip`; none reshapes a contract
- status: 🟡 **BEST-GUESSED — disputed**
- confidence: **80%**

## .the fork, stated fairly

the i004 r003 lane re-raised the three external-contract gaps answered at earlier rounds. none is
a change the driver is **permitted** to close this round.

| option | the claim |
|---|---|
| **A — hold, and cite the prior answers** | each gap is already answered on record, or needs a grant only a human holds |
| **B — repair now** | an external contract without a real-call test is a coverage gap the lane must block on |

| global | concern | why it holds |
|---|---|---|
| blocker.1 | the prompt-cache real-call test is absent | premise false for the tree: `src/domain.operations/review/stepReview.casePromptCache.integration.test.ts` is on the branch. it sits in a peer partition this lane did not read — a partition absent is not the tree absent (F228) |
| blocker.2 · blocker.3 | the S3 backup success path has no real-call test | it needs an AWS credential and a bucket that only a human can grant (F116); the refusal paths are pinned at integration, where they are reachable without the grant (F173). a test that cannot run without that key is not a change the driver is permitted to make |
| blocker.4 · nitpick.1 | the anthropic claude-sonnet suite is fully skipped | the skip predates this branch and holds a paid brain out of every CI run (F111). its docblock now names the scoped by-hand run (`--scope 'path://stepReview.caseBrain.claude-sonnet'`) in place of the `THOROUGH=true` the lane flagged in r001 |

## .taken, and why

**A.** blocker.1 rests on a partition-local read of a tree-wide fact; blocker.2–3 and
blocker.4 wait on a human grant (a cloud credential, a paid-brain budget). per
`rule.always.raise-a-blocker-a-taken-cannot-close`, a `.taken` cannot fill an absence that needs a
grant — so these are disputed and handed to the council, never re-argued round by round.

## .rework, and why

**clean.** once a human grants the bucket or the paid-brain budget, each cure is one added test
or one lifted `.skip` plus a run.

## .confidence, and why it is not higher

a strict reader holds that an external contract shipped without a real-call proof is a gap at
release, whoever holds the key.

## .where

`src/domain.operations/review/stepReview.casePromptCache.integration.test.ts` ·
`src/domain.operations/review/stepReview.caseBrain.claude-sonnet.integration.test.ts` · the S3
backup communicator and its integration suite

## .verdict

— (awaits the council)
