# F6 — the four content reads in `stepReview` stay unbounded, for want of a measurement

- raised 2026-09-22, by the driver, at i007
- rework: **clean** — a bounded-wave loop over four adjacent maps, no caller changes
- status: 🟡 **HALF-CLOSED at i011** — the descriptor half is FIXED; the heap half is open,
  and it is a different repair than this row was ever about
- confidence: **60%**

## 🔴 .the premise this row rested on was WRONG, and the error made the fork look harder

every version of this row — and of its dream — argued the number from **heap**: *"these hold
file BODIES, whose size varies by orders of magnitude within one corpus"*, and its own table
graded them *"the HEAVIEST of the three hazard sites in this package."*

⇒ **that read is false, and it is why fork B looked unanswerable.**

`stepReview` RETAINS all four arrays at once — `ruleContents`, `targetContents`, `refContents`,
and `conversationContents` are alive together at `compileReviewPrompt` (`stepReview.ts:705-708`).
so:

> 🔴 **no concurrency bound lowers the peak heap here by one byte.** the high-water mark is set
> by RETENTION, not by concurrency.

and the contrast with the 2gb precedent is exact. `getAllReviewRunMeters` bounds at 8 and its
own comment says why: *"the prompts a wave reads are FREED before the next wave allocates its
own"* / *"each is DISCARDED the moment its chars are counted."* **the wave is what frees the
last one.** that mechanism does not exist here, because the caller holds every byte regardless.

⇒ so the hazard was never one fork. it is **two**, and they have different repairs:

| half | what a bound does | status |
|---|---|---|
| **descriptors + threadpool** — a fan holds N handles open and floods libuv for the call | ✅ bounds it exactly | **FIXED at i011** |
| 🔴 **heap** — every byte of every file, held to the prompt | ✅ naught. the peak is retention | **OPEN**, and a bound is the wrong instrument |

## ✅ .what was fixed, and why the number stopped being a guess

once the reachable subject is **descriptors + threadpool**, the subject is *identical* to
`getAllTargetsTouchedAt`'s — so **64 is one justification reused, never a neighbour's borrowed**.
the package's own standard is satisfied rather than bent.

shipped as `getAllFileContentsBounded.ts` — one communicator at four call sites, which is the
extraction `enroll-impl-arch-defects` scoped at i009 (*"a bound pasted four times owes its
justification four times and can drift at three of them"*).

🔴 **and the clamp beside it found a defect the repair did not set out to fix.** `[case3]`
asserts an absent file THROWS the wrapped `failloud` error — and it went **red** on the first
run, because the fan's inherited guard `if (!(error instanceof Error)) throw error` reads
**false across module realms**: the `Error` a test realm holds is not the `Error` node's fs
module threw with. so the raw `ENOENT` escaped with no path, no hint, and no exit-code mapping.

⇒ **`failloud` had been silently downgraded to a bare errno, in exactly the case it exists
for** — and no test had ever asked. the peer `getAllTargetsTouchedAt` already wraps with
`String(error)` and no gate; the repair follows it rather than re-derive the brittle form.
`rule.require.clamp-edge-cases` paid here on a repair nobody expected it to.

## 🔴 .what is still OPEN, stated so it cannot be mistaken for closed

the **heap** half. `rhx review` holds the full text of every rule, target, ref, and
conversation file simultaneously, and that peak is unbounded by the corpus. a wider or
narrower wave changes it not at all.

⇒ its repair is a **fold that counts and discards**, or a prompt compiled by stream — a
contract change to `compileReviewPrompt`, not a loop. that is genuinely dirty, genuinely
unmeasured, and stays the wisher's call. **the trigger the dream named (an observed OOM, a
materially larger corpus) still applies to THIS half, and only to this half.**

## .the fork, stated fairly

`stepReview.ts:631-670` holds four adjacent `Promise.all` maps, each over a **full file
read** — rules, targets, refs, conversation. none is bounded.

two forks sit here, and only the first is usually noticed:

| fork | the options |
|---|---|
| **A — bound it, or not?** | bound now / defer until measured |
| 🔴 **B — if bound, at WHAT number?** | 8 (the meter's) · 64 (the peer's) · a measured one |

⇒ **fork B is the one that made A hard.** the bound is trivial to write and the *number*
has no defensible source, so a fix today ships a guess onto the live review path.

## .taken, and why at the time

**deferred**, and the dream carries the work
(`.dream/v2026_09_21.fix.the-four-content-reads-in-stepreview-are-unbounded.md`).

the reason, at the time:

- this package's own standard is that **a bound is owed its own justification, never its
  neighbour's** — `getAllTargetsTouchedAt`'s constant says exactly that in its `.why`
- the two bounds already in the package each have a subject-specific argument behind them:
  `getAllReviewRunMeters` bounds at **8** against a MEASURED 2gb heap death;
  `getAllTargetsTouchedAt` bounds at **64** against a threadpool + descriptor limit, over a
  subject that carries naught (a `stat`)
- these four carry **file bodies**, whose size varies by orders of magnitude *within one
  corpus* — a 40-line operation beside a 3,000-line snapshot. so neither argument transfers
- ⇒ a number chosen by eye costs **latency on every review the guard runs**: too low and
  eleven lanes serialize behind it, too high and it does not bound at all

🟡 and it **predates the branch** — `git blame` puts it 2025-12 through 2026-07, so it is
not a regression this drive introduced.

## .rework, and why

**clean.** the fix is a loop over four adjacent maps in one function, with a template
(`getAllTargetsTouchedAt.ts`) already in the package. no caller sees it, no contract moves,
no test outside that function changes shape.

⇒ so the council can rule either way at no teardown cost.

## 🔴 .confidence, and why it is not higher

**60%.** the reason to defer is sound and rule-cited, and two things undercut it:

1. **the peer lane graded it a live OOM risk**, and it is the HEAVIEST of the three sites in
   the package — the only one with no bound at all, over the largest units
2. 🔴 **"no measurement yet" is a reason that does not expire on its own.** the dream names a
   trigger (an observed OOM, a materially larger corpus, or the measurement taken for another
   reason) — and every one of those is passive. nobody is scheduled to take it

⇒ the honest read: this is a **correct deferral that could become a stale one**, and no
mechanism distinguishes the two.

## 🔴 .why this fulcrum exists at all, given the dream

`rule.always.fix-forward-under-scouts-honor` draws the line:

> a fix deferred for **size** gets a dream. a fix deferred for **DIRT** gets both — a dirt
> call is a judgment about ripple cost, and a judgment made alone is what a fulcrum list
> exists to surface.

the dream answers **SAFE — no, CLEAN — no**, so it is a dirt deferral by its own text. it had
a dream and no fulcrum for a full day, which is precisely the shape that rule warns of:

> **a dream alone reports the work and hides the call.**

⇒ and the call here is not *"should this be bounded?"* — everyone agrees it should. it is
🔴 **"is an unbounded live path acceptable for the time it takes to measure one?"** that is a
risk-acceptance decision, and it belongs to the wisher rather than to the driver who made it
mid-round.

## .where

- `src/domain.operations/review/getAllFileContentsBounded.ts` — ✅ the repair: one bounded
  communicator, with the retention-vs-concurrency argument in its `.why`
- `src/domain.operations/review/getAllFileContentsBounded.integration.test.ts` — the clamp,
  and `[case3]`, which caught the unwrapped-errno defect
- `src/domain.operations/review/stepReview.ts:705-708` — 🔴 the four arrays ALIVE TOGETHER,
  which is the heap half and the reason a bound cannot reach it
- `src/domain.operations/review/getAllTargetsTouchedAt.ts` — the template, and the `.why`
  that states a bound is owed its own justification
- `src/domain.operations/review/meter/getAllReviewRunMeters.ts` — the one bound with a
  measurement behind it
- `.dream/v2026_09_21.fix.the-four-content-reads-in-stepreview-are-unbounded.md` — the work,
  the shape of the fix, and what to measure first

## .the verdict, once ruled

> _unruled._
