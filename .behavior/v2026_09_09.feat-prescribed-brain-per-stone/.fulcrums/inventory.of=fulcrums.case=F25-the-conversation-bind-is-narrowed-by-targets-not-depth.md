# F25 — review lanes overflow: narrow the targets, never the conversation

**rework** = 🔴 dirty · **status** = open, time-sensitive · **confidence** = 55%

## .the fork

review lanes blew the 75% context gate and returned no verdict. the prompt has three terms:

| term | tokens | grows per round? |
|---|---|---|
| rules | 0.5k – 14.8k | no |
| targets | ~340k | with the diff |
| conversation | ~436k | 20–40k, without bound |

- **cut the targets** — `--paths-wout '**/*.test.ts*'` on lanes whose rubric does not grade tests;
  **split** a lane whose rubric spans both halves (`repo-rules` → `+ repo-rules-tests`,
  `mech-failhides` → `+ mech-failhides-tests`, `ergo-friction-hazards` → `+ …-snaps`)
- cut the conversation — drop `--conversation`, as `behavior-intent-coverage` does

## .taken, and why

**cut the targets.**

- a targets cut removes files a rubric does not grade — no rule loses its subject
- a conversation cut removes every argument answered back to the lane, so it re-raises settled points
- `behavior-intent-coverage` earns the exception: it grades coverage, which a `.taken` cannot close;
  judgment lanes do not

measured: with the cut applied, every lane with `--paths-wout` or a split rendered; every lane
without one went dark.

## .the counter-case — the stronger half

a targets cut buys a fixed sum once, against terms that grow. two terms, and they compound:

- the conversation, 20–40k a round
- the diff — 79 → 214 files in one round, because every `.taken`, term cluster, and dream written to
  answer a reviewer enlarges the next round's corpus

projected recurrence was 7–10 rounds; the measured was one. every l1 lane now carries an exclusion or
a split — **the lever is spent.**

## .rework — dirty

the durable fix is a depth bound on the conversation bind — the last n generations, per lane. it is a
new flag or `$conversation` form across `parseReviewArgs`, `stepReview`,
`enumRouteGuardReviewPeerConversationFiles`, and `runStoneGuardReviews`, and it reaches every `.guard`
in every adopter plus bhuild's templates. n is a judgment: too shallow and a settled `.taken` drops
out of view.

## .where

`$route/5.1.execution.from_vision.guard` · `src/contract/cli/review.ts` (`pathsWout` is one glob) ·
`.dream/v2026_09_17.reseed.a-conversation-bind-has-no-depth-bound.md`

## .the verdict

open. the call is live: dispatch the depth-bound engine ask now, or accept that the next overflow is
answered by a conversation drop and its coverage loss.

⇒ the full entry, with the per-lane audit and the overflow numbers: `../appendix/.fulcrums/inventory.of=fulcrums.case=F25-the-conversation-bind-is-narrowed-by-targets-not-depth.md`
