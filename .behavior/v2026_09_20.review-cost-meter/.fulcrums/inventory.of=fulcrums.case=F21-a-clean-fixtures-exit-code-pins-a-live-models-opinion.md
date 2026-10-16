# F21 — a clean fixture's exit code pins a live model's OPINION

- rework = 🔴 **dirty**
- status = OPEN — best-guessed *defer, catch a dream*
- confidence = 🟡 **78%**

## .the fork, stated fairly

r1 n1 asked for `rule.require.repeatable-for-llm-tests`'s declared split —
`criteria: process.env.CI ? 'SOME' : 'EVERY'` — where `blackbox/review.by.learner.acceptance.test.ts`
carried a bare `'SOME'`. the repair landed, and the suite **went red on the same day**, locally.

the failures are real and the cli is right. `assureCliExitedClean` (added this round) prints why:

```
the review cli exited 2, expected 0
   ├─ r2: term-aggregation
   │   ├─ rejected 6.6s
   │   ├─ 1 blocker 🔴
```

⇒ four cases assert `exit 0` over `src/clean.ts`. **that is an assertion about a live model's
judgment, not about a contract** — and sometimes the model raises a blocker on the clean fixture.

| the fork | what it costs |
|---|---|
| **A — revert to a bare `'SOME'` locally** | the flake is invisible again on the one machine where it is cheap to diagnose. 🔴 it is also a straight revert of a peer's blocker repair, and `rule.forbid.failhide` names it |
| **B — relax the four assertions** to what each case's own comment says it proves (the wrapper resolved · both rubrics ran · the verdict is readable) | correct if the cause is truly the model's opinion — and **indistinguishable from a test weakened to make a gate green**, which `rule.require.review-test-changes` forbids |
| 🟡 **C — measure the skew first, then choose** | costs a tally run and a one-line read, and it is the only branch that can tell A/B apart |

## .taken, and why at the time

**deferred**, with a dream that specifies all three and names C as the first move.

the reason at the time is one measured fact that neither A nor B accounts for:

> **all but one failure, across two independent runs, is `attempt 1`. attempts 2 and 3 are green.**

| run | breadth | red |
|---|---|---|
| full acceptance gate | 132 suites, 1687s | `[case-wrapper]` a1 · `[case-wrapper]` a3 · `[case-app]` a1 |
| this file alone | 1 suite, 194s | `[case-wrapper]` a1 · `[case-all]` a1 · `[case-app]` a1 |

**a uniformly random model verdict does not land on the first attempt 5 times in 6.** so a
mechanical cause is live — fixture reuse across attempts (all three share one `slug`), or a
prompt-cache replica that attempt 1 warms — and under either, B would relax an assertion that was
catching a real defect.

⇒ 🔴 **that is the whole argument for the defer.** B is not merely risky; it may be wrong, and the
measurement that would settle it takes one afternoon this stone does not owe.

## .rework, and why

🔴 **dirty.** the edit is four lines. the ripple is what the four lines *say*: the suite's premise
is *"clean code passes both learner rubrics"*, and B rewrites that premise in a file this branch
does not otherwise touch. a reviewer sees four one-line diffs; what changed is the contract the
whole suite grades against.

🟡 and the asymmetry runs the other way from F20's: here the diff is small **and** the blast radius
is small in code — the radius is in **sense**. that is harder to see in a PR, not easier.

## .confidence, and why it is not higher — 🟡 78%

higher than F20 because the deferral rests on a **measurement** (the attempt-1 skew, taken twice)
rather than a read. the three soft spots that keep it off 93%:

1. **the skew is n=6.** two runs, six failures. it argues loudly against pure variance and it does
   not close it. ten runs would
2. 🔴 **I did not read `genReviewByFixture`.** candidate 1 — that all three attempts share one
   fixture dir, so attempts 2–3 see a tree attempt 1 wrote into — is a **one-line read** that could
   close this entirely, and I chose not to take it because the deferral holds either way. *a call
   whose cheapest evidence you declined to gather is not a confident call*
3. **the CI bound is asserted, not observed.** every failure but one is attempt-1, and CI runs
   `'SOME'`, so CI is green **by construction** — an inference from the config, never a green CI
   run of this branch

## .where

- `blackbox/review.by.learner.acceptance.test.ts:37` — the criteria split r1 n1 asked for
- `…:41-70` — `assureCliExitedClean`, this round's durable half
- `…:109, 151, 220, 259` — the four assertions the fork is about
- `.dream/v2026_09_23.fix.the-learner-suites-clean-fixture-only-ever-fails-attempt-1.md`

## .the verdict, once ruled

_unruled._

## .see also

- **F20** — the same shape one domain over: *"is this a CONTRACT the repo enforces, or a HABIT the
  prompt steers?"*. F20 asks it of a filename prefix; F21 asks it of an exit code
- `rule.require.repeatable-for-llm-tests` — the config whose local half surfaced this
- `rule.require.review-test-changes` — why B is not a drive-by
- `rule.forbid.failhide` — why A is not either
