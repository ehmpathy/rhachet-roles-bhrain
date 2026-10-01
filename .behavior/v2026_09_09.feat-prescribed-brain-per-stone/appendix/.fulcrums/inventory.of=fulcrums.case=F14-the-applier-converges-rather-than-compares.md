# F14 — the applier CONVERGES rather than compares

**rework** = clean · **status** = ✅ **RESOLVED 2026-09-11** — by the answer to research #1, never by
a preference · **confidence** = 🔴 **100%**

> **the wisher, 2026-09-11:** *"it preserves the conversation, no worries"*

⇒ the 40% below was one unmeasured fact and it is now measured. **the redundant path is benign, so
`rule.require.fewer-paths-via-idempotency`'s blocker fires on the BRANCH:** a compare kept to skip a
benign idempotent re-run is the defect. **the collapse is mandatory rather than preferred.**

🟡 **this file is retained with its argument intact** — the case is what a later reader needs to know
the call was not taste. what follows is as written at 60%; the resolution is stated here and in the
final verdict.

## .the fork, stated fairly

at a stone boundary, the applier holds a declared brain. does it:

| candidate | what it does |
|---|---|
| **compare, then set** — the vision's r1 design (`case=6`) | read a believed current brain; dispatch only on a difference |
| 🔴 **set unconditionally** — raised by the wisher 2026-09-10 | dispatch `/model <declared>` every time, and hold no belief at all |

## 🔴 .taken — set unconditionally, and it is the repo's own booted rule

`rule.require.fewer-paths-via-idempotency` (`ehmpathy/role=architect`) states it outright:

> *"do not branch around an unsafe operation — make the operation safe. **every domain.operation
> should be idempotent, so the branch should be removable; if it is not, the operation is the
> defect.**"*
>
> enforcement: *"a branch kept to avoid redundant work, where the operation could have been made
> idempotent and safe but was not = **blocker**"*

`/model X` converges to the same state on a re-run. `case=6`'s compare is a branch kept **only** to
skip that re-run. ⇒ **the shape the rule forbids, and the vision shipped it as a demoed case.**

### 🔴 the sharpest evidence — this route CITED the rule and stopped one branch short

`F7` reaches for it verbatim, in its `.taken`:

> *"this leans on `rule.require.fewer-paths-via-idempotency`: rather than a branch that detects
> entry, make the dispatch idempotent and run it unconditionally."*

and two lines above, in the same section:

> *"the compare that `case=6` requires (declared vs live) **doubles as the entry detector** … so no
> separate 'did the stone change' memo is needed — **the idempotency does the work**."*

⇒ 🔴 **one paragraph deletes the entry branch by the rule and keeps the compare branch the same rule
forbids** — and cites the rule's own principle as the reason the compare is fine.

🟡 **the inversion is in the last clause.** *"the idempotency does the work"* is true, and what it
does is make the **compare** unnecessary. a design that invokes idempotency **to justify** a compare
has run the argument backwards.

⇒ so the wisher's question did not introduce a new principle. **it applied a principle this route had
already written down, to the branch beside the one where it was applied.**

## 🔴 .the argument that is stronger than the rule — a compare is BLIND, by construction

the compare is normally read as *the safe design plus an optimization*. it is the opposite:

| the applier | an out-of-band `/model`, typed by a human mid-drive |
|---|---|
| compare-then-set | 🔴 **never corrected.** its belief says the brain matches, so it skips — and it skips **every** subsequent boundary |
| set unconditionally | ✅ **corrected at the next stone**, with no detection at all |

⇒ 🔴 **the compare's own belief is what tells it to skip, so the drift it cannot see is the drift it
will never fix.** a convergent applier needs no belief and therefore cannot hold a stale one.

**and that is precisely `F5`'s 30% doubt, dissolved rather than answered.** `F5`'s counter-case reads:
*"the field would report the brain rhachet launched the clone with — which drifts the moment a human
types `/model` by hand. so the field answers 'what did enroll set' rather than 'what is the brain
right now', and those diverge exactly in the case that matters."*

⇒ **a convergent applier does not care which it answers**, because it asks neither.

## ⚠️ .the counter-case, stated fairly — and it is NOT the turn cost

the obvious counter is `case=6`'s: a redundant dispatch spends a turn of context and adds a
transcript line. that is a real cost and it is **not** what makes this a fulcrum, because the same
rule anticipates it — a benign redundancy traded for a deleted code path is the trade it asks for.

🔴 **the counter that carries weight is a side effect, and it is UNMEASURED:**

> **open question #1 — does a `/model` switch preserve the conversation?**

that question was filed as *nice to know*. it is the clause `rule.require.fewer-paths-via-idempotency`
turns on — *"collapse of a branch whose unconditional worst case is **not** benign, without first
making the operation safe = **blocker** (the branch carried real weight)"*:

| if `/model` … | the unconditional set is … |
|---|---|
| ✅ **preserves the conversation** — 🔴 **ANSWERED 2026-09-11** | ✅ **benign.** collapse the branch — the rule makes it mandatory rather than optional |
| ~~resets or truncates it~~ | ~~🔴 **destructive.** 13 context wipes on a 14-stone phase group~~ — **ruled out** |

⚠️ **so "it is idempotent" is a claim about the END STATE and never about the PATH.** an operation can
converge to the same state and spend a real cost on the way — and that was the one fact this fulcrum
could not settle from inside the repo.

🔴 **the answer came from the wisher in seven words, and the question sat on the list for five review
rounds graded as *nice to know*.** a fact that decides a design and is answerable by **one turn in a
live session** is not a research nicety — it is a **blocker on the design**, and the triage table
had no tag that would have said so.

⇒ the durable form: **before a compare-before-act is designed, ask whether the re-run it skips is
benign.** the answer deletes the whole read path or justifies it — and it is usually cheaper to
obtain than the compare is to build.

## 🟡 .what it does to the extant cases

| case | effect |
|---|---|
| `case=6` — *the brain is already right* | 🔴 its `[t0]`–`[t1]` optimization is **the branch this deletes.** it survives as its `[t3]`: the record must still say what happened |
| `case=6`'s normalize hazard | ✅ **deleted on the pre-dispatch side.** no compare, no false-positive-on-the-happy-path |
| `case=3` — *the slug the brain rejects* | ✅ **untouched.** its `[t2]` is a POST-dispatch verification — a different compare, and the one `clone get` serves |
| `F5` | 🟡 **weakened again.** the *apply* decision needs no brain read at all; only the *verify* does |
| `case=8` `[t3]` | 🟡 its *already-correct* verdict was a compare of declared against last-requested. with no compare, the line reads `set` every time |

🔴 **`case=6`'s title survives and its lesson inverts.** it argued *"the cheap check is the one that
runs first."* the correct lesson is **"the cheap check is the one you delete"** — and the case's own
`freq × cost` grade already conceded it: *"cost is near zero, and there is a workable route around
it."* ⇒ **it graded itself an alterpath and then demoed the branch as though it were required.**

## .rework, and why clean

it deletes a branch and one demoed optimization. no caller hardens against it, and `case=3`'s
verification is untouched. **to reverse it is to restore an `if`.**

⚠️ the one cost of a wrong call in this direction is **not** a rework — it is 13 context wipes per
phase group, silently, on the happy path. ⇒ **that is why the measurement precedes the collapse.**

## .confidence — 60% at raise, **100%** once research #1 answered

the direction was right and the org's own rule mandates it: a convergent applier is simpler **and**
strictly safer against drift.

**the 40% was open question #1**, and it was not a doubt about the argument — it was a fact nobody
had observed. 🟡 **a design that is correct-if-X, where X is unmeasured and cheap to measure, is not
a 70% call. it is a 100% call and a 0% call, and which one is a matter of one turn in a live
session.** ⇒ **that prediction held exactly**: the answer arrived in seven words and moved the call
to 100% rather than to 75%.

🔴 **so a percentage was the wrong instrument for this fulcrum, and the file said so before it knew
the answer.** a confidence figure implies a distribution over degrees of rightness; this call had
**two** outcomes and no middle. ⇒ **where a call is gated on one binary observation, the honest
record is the observation and its owner — never a number.**

## .where

`1.vision.experience.case=6.the-brain-is-already-right.md` — `[t0]`, `[t1]`, and its
`freq × cost` grade. plus the yield's mechanism section.

## .the verdict

✅ **RESOLVED 2026-09-11 — the applier converges.** it dispatches the declared brain at every stone
boundary and holds no belief about the current one.

| what the build carries | what it does not |
|---|---|
| an unconditional `/model <declared>` per boundary | 🔴 no pre-dispatch compare, no normalizer, no live-brain read to apply |
| `case=3`'s POST-dispatch verification, intact | — |
| a brain line on **every** stone (`case=8`) | no *already* / *switched* distinction — there are no no-ops |

⚠️ **it took no council round.** the item was gated on a fact, and the fact was one question away.
