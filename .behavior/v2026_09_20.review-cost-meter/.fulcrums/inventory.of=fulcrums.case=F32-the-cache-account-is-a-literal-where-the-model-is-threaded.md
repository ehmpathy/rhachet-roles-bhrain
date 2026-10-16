# F32 — the cache ACCOUNT is a literal in five places, where the model is threaded

- raised = 2026-09-24, by self, at the bar-by-bar audit's third pass (`i015`, bar 12)
- rework = 🔴 **dirty** — by the diff's boundary, never by the change
- status = 🟡 **BEST-GUESSED — option A deferred: dream + row in the same act**
- confidence = 🟡 **82%**

## .the fork

bar 12 asks that *"the warmer preserves the AFFINITY PIN"*. traced through two dependencies, the
pin's digest is:

```js
sha256(model + '\0' + systemPrompt)      // getOnePromptCacheAffinityKey, fireworksai
```

both named inputs check out. the **third** input to replica reachability does not appear in the
digest at all: the **account** the request bills to. a prompt cache lives on a replica of a
**deployment**, so two accounts are two caches however identical the key.

> **does an identity input that is a repo-wide constant owe the same mechanism as one that is
> genuinely per-invocation — or does a convention suffice where no value ever varies?**

| the input to the pin | how it is guarded |
|---|---|
| `model` | `--brain`, threaded from the spawn, 🔴 **no default**, and a loud `exit 2` where absent |
| `systemPrompt` | one `asRunArtifactPath` deriver, read by the writer AND the reader — drift is unexpressible |
| 🟡 the **account** | a repeated literal, in 5 places, which agree by convention |

🔴 **`--brain`'s own comment states why the asymmetry matters**, and every word of it reaches the
account verbatim:

> *"no default. a poke to a brain the review did not use warms a different provider's cache, so a
> defaulted brain would spend and report a hit while the next round still met a cold replica
> (`rule.forbid.failhide`)."*

## ✅ .no defect today — and that is exactly what makes it a fork

measured 2026-09-24. all five production surfaces read `prep`:

| surface | line |
|---|---|
| `review.ts` | 446 |
| `review._.warmer.ts` | 91 |
| `route.ts` | 1036 |
| `review.by.ts` | 212 |
| `reflect.ts` | 150 |

so the warmer and the review share one account, and the pin holds. 🔴 **the hazard is that a
one-line edit to any of the five breaks it silently** — and the failure mode is the worst this
subsystem has:

- the warmer pokes account A; the review reads account B
- pokes 2 and 3 HIT poke 1's prefix, **on account A's replica**
- so every warmer row reads a green `hit: true`, at full input rate
- and the review's own cache share never moves

⇒ **the instrument would certify a warmer that warmed naught.** an all-green report, a real bill,
and no surface that could tell the difference.

## 🟡 .the same grep found a SECOND value, and it sharpens option A

the literal is not one value in five places — it is **two values in eight**:

| value | surfaces | legitimate? |
|---|---|---|
| `env: 'prep'` | the 5 production CLIs above | ✅ |
| `env: 'test'` | `genTestBrainContext.ts:60` · `genReviewBrainSupply.test.ts:22` · `stepReview.integration.test.ts:101` | ✅ — a suite must not bill prod creds |

⇒ so a single bare constant is the **wrong** shape: it would either drag `test` onto `prep` or
need an override at three call sites, which is the sprawl it set out to remove. the honest form is
a **deriver over the env** — one owner, one place that maps an env to its creds — and that is a
larger change than *"extract a constant"*, which is a fact the fork must carry rather than
discover mid-repair.

🟡 **this is the `F14` lesson, at a different door.** a count taken by one grep, believed, and used
to size a fix. the grep here was run twice, and the second pass is what surfaced the split.

## .the forks

### A — one env-keyed deriver, read by all eight (preferred)

- ✅ **drift becomes unexpressible**, which is the same mechanism that makes the other two identity
  inputs whole — a construction, never a test
- ✅ it holds the prod/test split honestly rather than by accident
- 🔴 it touches five CLI surfaces and three suites, **six of which are not this branch's**

### B — thread `--env` from the review to the warmer, as `--brain` is threaded

- ✅ exactly mirrors the guard that already works, and covers the warmer pair specifically
- 🔴 it leaves the other literals in place, so the class stays open
- 🔴 and it is MORE code than A for LESS coverage — a flag, a parse, a refusal, a test

### C — leave it, and rely on the convention

- 🔴 **refused.** the convention is invisible: no file states that these literals must agree, so
  the next author to touch one has no cue at all (`rule.forbid.failhide`)

⇒ **A, and A alone.** B is the shape a reader reaches for by analogy to `--brain`, and it is the
worse of the two here: `--brain` needs a flag because the value is genuinely per-invocation, where
the account is a repo-wide constant that was copy-pasted.

## .the rework, and why DIRTY

| | |
|---|---|
| **safe?** | ✅ **yes.** a shared deriver is strictly more constrained than eight literals. it can refuse no value the literals accepted, and it cannot introduce one none of them held |
| **clean?** | 🔴 **no.** `route.ts`, `review.by.ts`, and `reflect.ts` are three CLI surfaces this branch opens in **zero** files, plus three suites likewise. to touch them inside a diff about review cost is the scope leak `rule.require.review-test-changes` forbids |

⇒ safe but not clean, so `rule.always.fix-forward-under-scouts-honor` names it a dirt deferral, and
a dirt deferral owes **both** artifacts: the dream records the work, this row records the call.

🔴 **and a PARTIAL application is worse than none.** to extract the deriver for the two
warmer-relevant surfaces and leave six literals behind ships an inconsistent set, where a reader
cannot tell whether the literals left in place are deliberate or missed.

## 🟡 .the confidence, and why it is not higher

**82%.** the measurement is exact and twice-run; two doubts hold:

- 🟡 **the account VALUE is a wisher question this row does not ask.** `prep` creds on every
  production review is a choice nobody on this branch made, and a deriver would make it look
  settled. ⇒ the repair should not be the act that ratifies it
- 🔴 **the hazard is a claim about a FUTURE edit, not an observed one.** no drift has occurred, so
  the row rests on *"somebody will eventually change one"*. that is the honest shape of a
  `rule.forbid.magic-values` row — and it is weaker evidence than any other warmer row on this
  board, every one of which was a live defect

## ✅ .its ground is a SCOPE ground, so a clock cannot expire it

four deferrals on this board have run out rather than been answered — `F14`, `F27`, `F29`'s
residual, `F30` — and all four rested on a **schedule**: a count that would grow, a peer who would
move on, a cursor that would shift.

⇒ **this one does not.** its ground is that six of eight call sites sit outside this stone's diff,
and that boundary does not move with time. it moves when a stone opens those files, or when a
wisher rules the value.

🟡 so unlike `F30`, this row owes **no scheduled re-read**. its trigger is a diff that already
touches `route.ts` / `review.by.ts` / `reflect.ts`, and the dream is where the next traveler meets
it (`rule.always.reuse-pavement-before-improvise`).

## .where

- `src/contract/cli/review.ts:446` · `review._.warmer.ts:91` · `route.ts:1036` ·
  `review.by.ts:212` · `reflect.ts:150` — the five production literals
- `src/.test/genTestBrainContext.ts:60` · `genReviewBrainSupply.test.ts:22` ·
  `stepReview.integration.test.ts:101` — the three `test`-valued twins that shape option A
- `.dream/v2026_09_24.fix.the-cache-account-is-a-literal-in-five-places-where-the-model-is-threaded.md`
- `appendix/i015.every-warmer-bar-audited-against-its-clamp.md` — *"the third pass — bar 12,
  traced through TWO DEPENDENCIES"*, where the five-hop chain is recorded

## .the verdict

_(unruled — the council's, and the account value itself is the wisher's)_

## .see also

- `F31` — the other `F30` residual. both are deferrals a clock cannot expire; that one waits on a
  dependency approval, this one on a diff boundary
- `F14` — the row that taught that a count taken by one grep goes stale. the prod/test split above
  is the same lesson, caught by a second pass rather than by a later reader
- `rule.forbid.magic-values` (ehmpathy/mechanic) — the class this literal belongs to
- `rule.forbid.failhide` — what a silent account mismatch would be
- `0.wish` bar 12 — the purpose clause whose trace surfaced this
