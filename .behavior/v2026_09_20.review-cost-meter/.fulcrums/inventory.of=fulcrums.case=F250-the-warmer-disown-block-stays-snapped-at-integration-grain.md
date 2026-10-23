# F250 — the warmer disown block stays snapped at integration grain

- raised 2026-10-12, by `ergo-contract-snapshots` (blocker.1), at 5.3 i004
- rework: **clean** — a new acceptance case is additive; no prod contract moves
- status: 🟡 **BEST-GUESSED — disputed**
- confidence: **75%**

## .the fork, stated fairly

the disown block (`🟡 warn: warmer: off — and a warmer from an earlier round is STILL awake`)
reaches a caller's stderr on a lane'd `--warmer off` round where an earlier warmer's watermark is
live. its whole render is snapped at integration grain
(`emitReviewWarmerDisowned.integration.test.ts:149`, `toMatchSnapshot` over the normalized
block). no acceptance case pins it.

| option | the claim |
|---|---|
| **A — hold at integration grain** | the integration suite drives the real emit against a real on-disk watermark store and snaps the whole block, pid masked. a reword of the sentence goes red there today |
| **B — add an acceptance case** | `rule.require.contract-snapshot-exhaustiveness` asks for the snap at contract grain; a cheap live-brain review already runs in `reviewWarmerSilence.acceptance.test.ts [case1]`, so the cost objection of F239 does not reach this half |

## .taken, and why

**A.** the cost objection is conceded — the reviewer is right that a live brain call is cheap. the
obstacle is where the case must run, not what it costs:

- the block fires only on a **lane'd** round, and a lane exists only where the output path sits
  in the guard grammar (`$route/.reviews/peer/…given.by_peer.$slug.md`)
- the watermark it reads is keyed to that lane, so the case must seed a **live** watermark for it
- the brain registry resolves from the repo root, so `rhx review` must run with cwd at the real
  checkout (`rule.forbid.cwd-outside-gitroot`)

⇒ the case would write a seeded live watermark and a lane'd output into the real checkout's warmer
store and route reviews dir. a stale seed left by a crashed run reads to every later round as a
live warmer, which is the exact false alarm the disown block exists to raise. a hermetic home for a
lane'd round is the fixture F239 already names as owed.

## .rework, and why

**clean.** once a hermetic lane'd fixture exists (F239), the case is one new `given` beside
`reviewWarmerSilence [case1]`: seed the watermark, run `--warmer off`, mask the pid, snap.

## .confidence, and why it is not higher

the reviewer's view of the rule — "masked, then snapped live, never carved out" — is the rule's
plain text, and the integration snap is one grain below it. if the council judges the fixture cost
small, B wins.

## .where

`src/domain.operations/review/warmer/emitReviewWarmerDisowned.ts` ·
`src/domain.operations/review/warmer/emitReviewWarmerDisowned.integration.test.ts` ·
`src/contract/cli/reviewWarmerSilence.acceptance.test.ts`

## .verdict

— (awaits the council)
