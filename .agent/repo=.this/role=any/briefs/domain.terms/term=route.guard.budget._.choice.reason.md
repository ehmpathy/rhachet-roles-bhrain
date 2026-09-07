# domain.term.choice.reason: route.guard.budget

## .etymology

**budget** comes from a *bouge* — a leather pouch.

- what the word has always named is a pouch with countable contents that draws down as you spend
  it, never a span of time
- ⇒ that is exactly the concept here: a reviewer opens the pouch once per round, and when it is
  empty the reviewer is `exhausted`

the rejected candidates each lost on a specific property:

| candidate | why it lost |
|---|---|
| **quota** | a quota is imposed from outside and is usually a floor to *meet*, not a store to *spend*. it also reads as a per-period reset, which this has none of |
| **allowance** | reads as a recurring grant. this is granted once and topped up by an explicit act |
| **limit** / **cap** | both name a boundary you approach, never a store you draw down. a limit does not become exhausted — you simply hit it. and neither can be *added to*, which is the operation the cli publishes (`--add N`) |
| **attempts** | already taken, by the test harness's `when.repeatably({ attempts })`, for a different concept: how many times to re-run one probabilistic case. an overload across the same repo |

⇒ **the deciding property is `--add N`.** the published operation is *put more into the pouch*, and
`budget` is the only candidate whose plain sense supports that verb.

## .disputes

### dispute: budget-as-a-duration — raised 2026-09-02 — status: RESOLVED (keep `budget` for rounds; the time sense reuses the extant `timeout`)

- raised.by = a mechanic mid-round, without noticing
- claim = the word `budget` reads naturally over a per-test time allowance too, and was used
  that way throughout a round of cicd repair — in code comments, in four commit bodies, and in a
  dream that went on to propose a shared const for the value
- counter = the two are distinct concepts, never two shades of one
  - a review budget is a count of rounds a reviewer spends, and a spent one yields `exhausted` — a
    verdict the unlock ladder reads and acts on
  - a per-test time allowance is a duration the clock spends on its own, and a spent one yields
    `Exceeded timeout` — a defect report, never a verdict
  - ⇒ **one is an entity in the domain's control flow; the other is a failure mode**
  - to share a word is the ABSENT DISTINCTION `rule.forbid.domain-term-ambiguity` forbids, and it
    misroutes the reader in the direction that costs most — it invites *"just add more budget"*
    against a call that is hung, where more time changes naught
- resolution = `budget` stays with this cluster's sense
  - the time sense reuses the extant `timeout` — no coinage, because this repo already declares one
  - a `*.guard` key (`review.timeout`) typed `IsoDuration`, with `DEFAULT_REVIEW_TIMEOUT = 'PT21M'`
    in both `runStoneGuardReviews.ts` and `stepReviewBy.ts`

### 🟡 a word was invented before the extant one was checked

the first resolution proposed `ceiling`, on the strength that the round's own prose had reached for
it unprompted. two independent facts overturned it:

1. the repo's gerund hook rejects `ceiling` on every write — a word this tree's own tooling blocks
   can never be applied consistently, so it was unusable as a term regardless of its merit
2. `timeout` was already paved and never looked for. it is a declared key with a declared type, and
   it names exactly this concept. `ceiling` was an improvisation laid beside a serviceable path —
   the braided trail of `rule.always.reuse-pavement-before-improvise`

⇒ **so the useful record is not which word won — it is that the dispute was half-argued.** the
overload was correctly spotted and the replacement was invented rather than searched for. a
resolution owes a glob before it owes a candidate.

🟡 the overload nonetheless reached no contract, and that was luck rather than discipline. the word
had spread through comments and four commit bodies — which `rule.forbid.domain-term-synonyms`
permits — and the next artifact drafted was a const named `*_BUDGET`, which it does not.

## .evidence

**discovery = a scenario timeline, from a real round on 2026-09-02.** the two senses were driven
side by side within one hour, which is what made them separable:

| the observation | the sense in play |
|---|---|
| a reviewer showed `exhausted 🌙` with blockers already closed; `--add N` settled it | rounds — the reviewer had no round left to CONFIRM the fix |
| five suites failed `Exceeded timeout of 90000 ms`; a raised env default settled it | duration — the ceiling sat under the true cost |
| one suite failed `Exceeded timeout of 540000 ms`, where normal was 90s; a **retry** settled it, in 96s | neither — a wedged upstream, where more of either would have changed naught |

⇒ **the third row is the one that proves the distinction carries weight.**

- it presents identically to the second — same words, same exit — and wants the opposite repair
- a reader who holds one word for both reaches for *more allowance* in all three cases, and is
  wrong in the third

## .invariants

- a budget is a non-negative integer count of rounds; it is never a duration, and never a rate
- it is spent one unit per rendered verdict, by that reviewer alone — reviewers do not share
- a spent budget yields `exhausted`, which is **terminal for the unlock ladder and NOT passage**
  (`define.invariant.review.peer.exhausted`)
- it may be extended mid-drive by the driver, per stone, across every reviewer at once
- a `*.guard` re-stamp that drops a granted budget is a clobber, and is warned rather than
  applied silently (`getBudgetClobberWarnings.ts`)

## .see also

- `term=route.guard.rung._.choice._.md` — the ladder a budget is spent on; also a boundary-qualified
  term, for the same reason
- `term=route.guard.review.malfunction._.choice._.md` — the other verdict a reader confuses with a
  clock failure
- `rule.forbid.domain-term-ambiguity` — the rule this dispute was settled under
- `rule.always.reuse-pavement-before-improvise` — the rule the first resolution broke
- `.dream/v2026_09_02.fix.llm-suites-inherit-a-90s-default-silently.md` — the const that must not
  be named `*_BUDGET`; it takes `*_TIMEOUT`
