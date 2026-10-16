# F180 — a runaway think asks once more, inside the brain call

- raised 2026-10-07, from 5.1 i018 r002 `repo-rules-contract` and r017 `repo-rules-briefs`
- rework: **clean** — one wrapper at one call site, plus one guard line in the partition retry
- status: 🟡 **BEST-GUESSED — a per-ask retry of a length cutoff, once, same brain**
- confidence: **80%**

## .the fork, stated fairly

a lane on `openrouter/deepseek/flash` sometimes returns `finish_reason=length` at the model's
131,072-token output limit with an EMPTY reply. `rhachet-brains-openrouter@0.1.3` throws it as a
`MalfunctionError`, the lane malfunctions, the judge scores it one blocker, and the round must be
re-arrived.

| option | the claim |
|---|---|
| **A — retry the ask once, in the brain call** | the runaway is sampled, so a second ask converges; a second runaway malfunctions the lane with both asks named |
| **B — lower the output limit** | a runaway fails sooner and bills less |
| **C — pick a faster / different host** | the off-floor `speed=min50tps&privacy=full` slug (Together) returned a verdict on every replay |
| **D — leave it** | a malfunction already surfaces; the driver re-arrives |

## .what the logs say — the diagnosis

| fact | evidence |
|---|---|
| all four runaways on this route were served by **InferenceNet** | the `audit:` line of i015 r008, i016 r013, i018 r002, i018 r017 |
| every token was think, none was reply | `contentLength: 0` with `tokensOutput: 131072` in each error's metadata |
| the prompt was NOT the cause — not its size, not its rules | i018 r002 / r017 expected 147.2k / 144.9k tokens, 40 rules each — smaller than most of the 20 i018 lanes that completed on InferenceNet (355k–704k billed input). and **the same lanes completed on their other rounds**: `repo-rules-contract` 0/0 at i015, i016, i017; `arch-smell-scopeleaks` 2B at i016, 0/0 at i017 |
| the runaway is FAST, not slow | r002: generation start to given written, ~219s for 131,072 tokens (~600 tok/s). r017: ~238s (~550 tok/s). the completed InferenceNet lanes ran 19k–74k out at ~150–475 tok/s. so these runaways cost ~4 min of wall each, not the 20-minute deadline |
| whether it LOOPED | **cannot be known.** the brain package withholds the partial reply and sends no think text up; the run dir holds no `output.*` artifact on a fault. the only hint is the throughput: ~600 tok/s beats every completed lane on the same host, which fits a degenerate repeat (speculative decode accepts repeated tokens cheaply) — a hint, not evidence |
| the package sends no output bound and no think bound | neither `max_tokens` nor a think bound appears in `rhachet-brains-openrouter@0.1.3/dist`; 131,072 is the host's default |

⇒ **root cause: a sampled think that never ends on `deepseek/flash`, observed only on InferenceNet
(which also serves ~19 of 20 completed lanes, so the host link is confounded).** the cause lives in
the model and its host, outside this repo. what this repo owns is the COST it pays for one: a
malfunctioned lane, a blocker, and a whole re-arrive round.

## .taken, and why

**A.** it is the honest bound on a cause outside our control, and it is the shape
`rule.forbid.dropped-partial-review-progress` names ("the retry is per failed piece"):

- the event is sampled — four of ~90 asks on this route, never twice on one lane — so one more ask
  converges where it matters, inside the lane's deadline, at ~4 min, rather than ~6 min of a whole
  re-arrived round for 22 lanes
- **one** retry, no wait: each runaway bills the full limit (~$0.26 at the i018 output rate), so a
  third ask doubles down. a second runaway malfunctions the lane, named twice, with the
  `finishReason: 'length'` kept so the partition-level retry (`withOneRetryOnBrainCallFault`) does
  not stack a third ask on top
- the runaway is METERED, not merely reported: the brain's answer carries only the ask that
  answered, so the wrapper returns each runaway's evidence beside the answer and
  `asReviewRunMetricsRealizedOfAsks` folds it into `metrics.realized.json` — output tokens as the
  provider billed them, input as the answered ask's prompt count priced at the full input rate (an
  upper bound, since its cache split is unreported), summed into `tokens` and `cost.total` and
  listed under `runaways[]` with its host, generation id, and basis. every roll-up
  (`rhx review._.cost --of run|tree|grove`, the partition merge) reads those totals, so none
  under-reads. stderr still names the runaway as it happens

**not B:** this repo cannot set it — the brain package's `ask` takes no output bound, and the
2026-10-07 experiment showed a think cap is not honored on these hosts. **not C:** a host choice
is a slug change for every guard, and the experiment's cost was a wash only with a primed prefix;
it stays a candidate for the wisher, and is recorded in the reseed dream. **not D:** the
malfunction is honest but the re-arrive is the costly half, and a sampled event earns no blocker.

## .rework, and why

**clean.** `withOutputLimitBrainRetry` wraps the ask at one call site in `stepReview`; to remove it
is to unwrap one call, drop the fold, and drop one guard line in `withOneRetryOnBrainCallFault`.
the `runaways[]` field on `metrics.realized.json` is additive: an older file without it reads as no
runaway.

## .confidence, and why it is not higher

- n = 4 runaways, all on one host; a host-correlated cause would make a same-host retry weaker than
  the "never twice on one lane" record suggests
- the meter's two known limits, both biased high or absent, never low:
  - a runaway's input is priced at the full input rate; had it hit the cache, the true bill was
    lower. its output count is exact
  - a lane whose BOTH asks run away throws, and a failed brain call writes no
    `metrics.realized.json` (as for every brain fault — `caseProviderOutage`). the meter grades
    that run `unknown` and renders its cost absent, never `$0`; the two asks' spend is named only in
    the malfunction's `asks` metadata. the same holds for a runaway followed by a different fault,
    and for a runaway whose output count the package did not report (no total is written rather
    than a low one)
- it is not proven that the retry converges in production: the clamp proves the mechanics with a
  fake, and the experiment's replays of two runaway prompts did not run away again

## .where

`src/domain.operations/review/withOutputLimitBrainRetry.ts` ·
`src/domain.operations/review/isErrorOfReplyCutAtOutputLimit.ts` ·
`src/domain.operations/review/asOutputLimitRetryLine.ts` ·
`src/domain.operations/review/asReviewRunMetricsRealizedOfAsks.ts` (the meter fold) ·
`src/domain.operations/review/ReviewRunMetricsRealized.ts` (`runaways[]`, `BASIS_OF_RUNAWAY_ASK`) ·
`src/domain.operations/review/stepReview.ts` (the brain call) ·
`src/domain.operations/review/partition/withOneRetryOnBrainCallFault.ts` ·
clamp: `src/domain.operations/review/stepReview.caseOutputLimitRunaway.integration.test.ts`

## .verdict

(open)
