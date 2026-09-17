# F01 · the stance is declared per REVIEWER, never per stone

- **rework** = clean · **confidence** = 80% · **status** = best-guessed

## .the fork

the wish says *"a driver's response carries exactly one of `<dispute>` or `<concede>`"* — singular,
against *"the judge's verdict"*. that reads as one signal per **halt**.

**option A** — one stance per stone: `--as disputed --stone 1.vision`.
**option B** — one stance per **reviewer**: `--as disputed --stone 1.vision --with architect`.

## .taken, and why

**option B.**

- **budget is a per-reviewer meter.** `RouteStoneGuardReviewPeerMeter` is keyed `{stone, reviewer,
  rounds}`. acceptance #2's *"consumes no budget"* is only a checkable claim at that grain.
- **the extant debt is reviewer-keyed.** `getLatestPeerGivensPerSlug` keeps the latest given per
  slug, and `--as contemplated --that <slug>` already takes a slug. a stone-level stance would be
  the one review verb that does not.
- **a real drive disagrees with one lane and agrees with another.** an eleven-lane guard where ten
  are right and one is wrong has no honest stone-level answer.
- **the stone-level signal derives from B; the reverse does not hold.** *"the stone proceeds when
  every lane that rejects carries a stance"* computes from B. A cannot recover **which** lane was
  disputed — and that is precisely what the council needs.

## 🔴 .the consequence this row did not carry, until r3

B is the right call and it **changes how three acceptance criteria read**, which a reader of this
entry alone would not learn:

| the wish's words | under B |
|---|---|
| #2 *"the **route** drives on"* | **that lane's** hold lifts. with 3 lanes and 1 dispute the stone still holds |
| #1 *"neither, or **both**, is refused"* | one `--as` per invocation, so *both at once* cannot occur — the real case is a **later** contrary stance |

⇒ **a fulcrum that records only the choice hands the council half the decision.** the other half is
what the choice costs a grader who reads the wish literally — and that half is where a correct design
gets read as a failure. now stated in the yield's `.evaluation`, above the acceptance table.

## .rework, and why

**clean.** `--with <reviewer>` is a **new flag name over a reused check** — the slug validation is
`setStoneAsContemplated.ts:77-92` whole, and only the name differs. to collapse to a stone-level
stance later is a fold — drop the flag, apply to all slugs that reject — with no change to storage
shape.

🟡 **the name differs from `--as contemplated`'s `--that` on purpose.** a stance is taken **with** a
reviewer; an answer is written **about** what they said. ⇒ the parser dispatches on `--as`, so each
status names its object in its own grammar — see the yield § *the canonical signature*.

## .confidence, and why it is 80%

the four reasons above are strong. the 20% sits in the wish's own words: *"the judge's verdict"* is
singular, and the **judge** is a distinct rung from the peer lanes (`JUDGE_LEVEL = 999`). if the
wisher meant the judge specifically, the grain question re-opens on different ground.

⇒ **what would settle it:** whether *"the judge's verdict"* means the judge rung, or is loose for
*"the review's verdict"*. acceptance #1 says *"at the peer-review gate"*, and that is the sense
taken here.

## .where

`1.vision.yield.md` § *the contract* · every `[tn]` in `case=1`

## .the verdict

_not yet ruled._
