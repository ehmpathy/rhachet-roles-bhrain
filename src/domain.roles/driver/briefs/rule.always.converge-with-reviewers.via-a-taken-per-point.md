# rule.always.converge-with-reviewers.via-a-taken-per-point

## .what

a **zoom-in** of `rule.always.converge-with-reviewers._.md` onto the one mechanical obligation the
contemplation loop imposes:

> **for EVERY `.given.by_peer` point, you MUST author the paired `.taken.by_self` before you
> re-arrive. no exceptions, every round.**

the parent rule says *converge rather than escalate*. this one says what the reviewer actually
reads, and therefore what a re-arrival owes it.

## .why — it is not a courtesy, it is how the reviewer computes

the reviewer weighs each prior point against your response:

| the point has | the reviewer does |
|---|---|
| a `[REPAIR]` or `[REFUTE]` | drops it |
| **no response** | **re-raises it** |

⇒ from the reviewer's side, an unanswered point is an unaddressed one. so **a code fix with no
`.taken` reads as no fix at all**, and the identical blocker returns — correctly.

this is why the obligation is absolute rather than proportional to how obvious the fix was. the
reviewer cannot see your diff's intent; it sees the points and the responses.

## .the two shapes — a `.taken` is exactly one of them

| shape | the claim | what it must carry |
|---|---|---|
| `[REPAIR]` | *"i fixed it"* | a quote of the **current** `target.file`, as proof the fix is present now |
| `[REFUTE]` | *"the critique does not hold"* | a reasoned, evidence-cited argument — extant code out of scope, a false positive, a deliberate tradeoff |

then, per point:

```sh
rhx route.stone.set --stone <stone> --as contemplated --that <slug>
```

**and only then re-arrive.**

## .the cues — when → then

| when… | then… |
|---|---|
| you fixed a blocker **in the code** and reach for `--as arrived` | 🔴 stop — write the `[REPAIR]` first, or the reviewer never learns of it |
| a point is obviously right and you fixed it in one line | it still owes a `.taken`. obviousness is invisible to the reviewer |
| the **same blocker returns** after you fixed it | check whether you ever told the reviewer, **before** you diagnose the reviewer |
| you judge a point out of scope | that is a `[REFUTE]`, not a skip. a skip reads as an unaddressed point |

## 🟡 .the incident, and the mis-diagnosis that followed

on `ehmpathy/declastruct-aws` branch `vlad/ses-emails`, a driver fixed reviewer blockers **in the
code** and re-arrived the stone with **no `.taken`**. the reviewer had no `[REPAIR]` to weigh, so
it re-raised the same blockers — exactly as designed.

the driver then diagnosed this as a *"reviewer defect"*, then as a *"commit visibility problem"*,
and finally marked the stone **blocked**. a total dead end.

**the reviewer ran exactly as designed. the miss was entirely the driver's.**

⇒ **a re-arrival with any open point that has no `.taken` is a driver error, never a reviewer
defect.**

## ⚠️ .the gate counts REVIEWERS. this rule counts POINTS

the entrance gate refuses a round while any reviewer still owes a `.taken`. it cannot check that
the one `.taken` you wrote answered all six points that reviewer raised — **one file discharges the
slug, however many points sit behind it.**

⇒ **so the gate enforces the parent rule and not this one.** a round that passes the door can still
violate every line above, and the reviewer — which *does* count points — re-raises each one you
skipped. the door is a floor; this rule is the work.

## .enforcement

- a re-arrival with any open `.given.by_peer` point that has no paired `.taken.by_self` =
  **blocker**
- a `[REPAIR]` with no quote of the **current** file = **blocker** — the claim is unverifiable
- a `[REFUTE]` with no evidence cited = **blocker** — a bare disagreement does not converge
- a reviewer graded a **malfunction** because it re-raised a point that had no `.taken` =
  **blocker** — the diagnosis is inverted

## .see also

- `rule.always.converge-with-reviewers._.md` — the parent: converge rather than escalate
- 🔴 `rule.forbid.unanswered-exits-from-a-blocker` — **the forbid twin.** this rule says every point
  owes a `.taken`; that one says the other doors out of a blocker are shut. its worked case is a
  **reported** 32-iteration stall with 300+ givens and zero takens — reported, never measured
  first-hand, and its `example=` file states why
- `rule.always.converge-to-terminal` — the whole-ladder discipline this feeds
- `rule.always.diagnose-reviewer-malfunctions` — what a **real** reviewer break looks like, so an
  unanswered point is never mistaken for one
