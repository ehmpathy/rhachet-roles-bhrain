# F41 — the `conversation` input is MEASURED and UNCLAMPED

| | |
|---|---|
| **rework** | 🔴 **dirty** — a depth flag ripples into the parser, the compiler, the census, the guard's expansion, and every `--conversation` snapshot |
| **status** | 🔴 **OPEN — deferred 2026-09-26, caught as a dream.** surfaced by the i010 overflow diagnosis (`r002`, `r008`) |
| **confidence** | 🟡 **95%** that the unbounded growth is real and measured · 🔴 **40%** that a depth clamp is the right shape rather than a byte budget |

## .the fork

`$conversation` expands to every prior `.given`, `.report`, and `.taken` for the stone, with **no
depth flag, no count bound, and no byte bound**. it is monotone in rounds by construction.

measured on this branch: `.reviews/peer` is **~1.4M chars ≈ 350k tokens**, which is **33% of a
1,048,576-token window** before a rule or target byte is added.

🔴 **this branch MEASURES that input and does not bound it.** the composition census names
`conversation` as one of its nine rows, so the instrument reports the growth and no lever answers it.

| fork | what it buys | what it costs |
|---|---|---|
| **A — leave it** (taken for now) | no ripple; `--focus pull` buys headroom for the next few rounds | the trend is untouched, so a pull lane overflows too, a few rounds later |
| **B — a `--conversation-depth <n>` clamp** | the input stops to scale with round count | 🔴 a reviewer that re-raises a point answered three rounds ago reads as a reviewer defect. the prompt must SAY it truncated, or the bind defect is invisible |
| **C — a byte budget rather than a count** | bounds the quantity that actually matters | a budget cut mid-`.taken` hands a lane an argument with its evidence removed — worse than its absence. so it needs whole-generation granularity anyway, which is B with extra arithmetic |

## 🔴 .why the DEFAULT is the hard part, and why the cache cuts both ways

lever D puts the conversation in the prompt **tail**, behind the target corpus that
`getAllTargetsByCacheStability` sorts for stability. so a clamp that drops the OLDEST generations
**keeps the volatile slice** — the content that changes every round.

⇒ the clamp could raise the hit rate (less mass behind the prefix) or lower it (the retained tail is
the half that churns), and **nobody has measured which**. a default picked without that measurement
is the same defect `F17` records for the tail flip: a lever shipped on an argument rather than on a
number.

## .why it is not this round's work

both SAFE and CLEAN answer **no**:

- it changes what every reviewer on every lane can see, so a tight default costs rounds across the
  whole ladder
- it ripples into `parseReviewArgs`, `compileReviewPrompt`, the composition census (`conversation`
  is a named row whose sense would shift), `runStoneGuardReviews`, and every `--conversation`
  snapshot

⇒ a fix-forward is forbidden here by its own test (`rule.always.fix-forward-under-scouts-honor`), so
the work is a dream and the **judgment to defer** is this row.

## .what would overturn it

- a lane that overflows **under `--focus pull`** — which would prove the headroom bought by lever A
  is already spent, and move this from a trend to a blocker
- a measurement of the clamp's cache effect, which would settle the default and collapse the 40%

## .where

- `src/domain.operations/route/guard/review/runStoneGuardReviews.ts` — the expansion
- `src/contract/cli/review.parseReviewArgs.ts` — where a `--conversation-depth` would land
- `.dream/v2026_09_26.fix.the-conversation-input-has-no-depth-bound.md` — the work

## .the verdict

_(unruled)_
