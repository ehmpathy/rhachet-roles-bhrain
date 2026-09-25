# rule.always.bear-every-self-review

## .what

> **a self review cannot be overridden. it is borne and carried out — as many honest reviews as it
> takes, however many that turns out to be. there are no shortcuts.**

every other gate on a route has a lever. a peer reviewer can be overruled. a review budget can be
topped up. a stone can be approved as-is. **the self-review ladder has none of them**, and that
absence is deliberate rather than an oversight.

## ✅ .the absence is MECHANICAL, not merely a norm — verified

do not read this rule as an exhortation to try harder. **there is no override to reach for.**

| lever | where it lives |
|---|---|
| `--as overruled` | `route/judges/setStoneGuardOverrule.ts`, `route/guard/review/**peer**/meter/getOverruledReviewerSlugs.ts` |
| `rhx route.guard.budget --for review` | the **peer** meter |
| `--as approved` | the stone, after the ladder — never in place of it |

⇒ **every overrule operation in the codebase sits under `guard/review/peer/`.**
`guard/review/self/` has not one. so a driver who reaches for an override on this ladder is not
denied — it finds no such lever at all, which is why the ask must never be made.

## 🔴 .the count is the WORK, never a budget

this is the misread that produces every violation of this rule.

a peer meter has a **budget**: N rounds, spent down, and exhaustion is a legitimate terminal state
(`rule.always.converge-to-terminal`). a driver correctly reasons about how many rounds remain.

**a self-review count is not that.** `review.self 3/7` does not say *"four rounds of allowance
left"* — it says *"four reviews are owed."* it can rise. it can re-trigger on the same slug. and a
count that rises is **more work discovered**, never a defect to diagnose.

| the peer ladder | the self ladder |
|---|---|
| a budget, spent down — **and a debt per blocker beside it** | a debt only |
| exhaustion is terminal and honorable | there is no exhaustion — only an unpaid remainder |
| a human may overrule it | no one may |
| more rounds cost the human's attention | more reviews cost only yours |

⚠️ **row 1 is narrower than it used to read: the peer ladder carries a debt too.** an unanswered
blocker is a `.taken` owed, keyed to the reviewer and untouched by its budget
(`rule.always.converge-to-terminal`). so what parts the two is **not** budget-versus-debt — it is
rows 2 and 3: the peer debt sits beside a budget and under a human overrule; the self debt has
neither.

🟡 **that last row is why the two are governed differently.** a peer round spends a scarce shared
resource, so a ceiling on it is prudent. **a self review spends only the driver's own effort**, so
a ceiling on it would protect nobody and would cost the artifact everything.

## 🔴 .the guard holds you for NO duration. that is not a permission

🌙 **the liveness hatch is retired, and so is the clock that made it necessary.** the guard once
refused a promise for 30 seconds and offered a `attempts >= 3` escape from the refusal. neither
exists: the clock decides whether a **paragraph renders**, never whether a promise passes.

⇒ so the shortcut this rule forbids got **cheaper**, not harder. a promise that reviewed naught now
clears on the **first** command.

> **what the guard permits and what you owe are two different quantities. only one of them is your
> business.** the gap between them just widened, and the whole of it is yours to hold.

🔴 **the one confrontation left is a CUE, not a gate.** promise inside 30 seconds of the ask, on
your first attempt, and the guard renders `patience, friend` — the identity reframe and the four
when-then cues. **it holds you for no time at all.** read it and answer it honestly, or ignore it
and pass. that choice is the rule.

the same holds one rung down: the guard checks that the articulation **file** sits at the owed path
and is newer than the ask. a file that satisfies both checks and reviewed naught satisfies the
guard and violates this rule.

## .the cues — when → then

| when… | then… |
|---|---|
| the self-review count **rises** rather than falls | 🔴 that is more work found, not a defect. carry it. do NOT diagnose the guard |
| you are about to ask a human to **waive** a self review | there is no lever to grant it. the ask spends their attention on what they cannot give |
| the guard renders `patience, friend` and you promise again at once | 🔴 it cost you naught to ignore, which is exactly why it is a test of you rather than of the guard. read the four cues and answer them |
| you write an articulation you could not defend to a peer | it is not an articulation. begin again |
| you notice the promise cleared on the **first** try | that is the design, never a signal you reviewed enough. the clock was removed because it charged the thorough driver, not because the bar fell |
| you **repair the artifact** mid-review | 🔴 do it. a repair costs you naught now — the trigger is keyed `(stone, slug)`, so no repair re-triggers a review or re-starts a clock |
| you reach for `--as blocked` because the ladder feels long | 🔴 length is not a wall (`rule.always.spend-own-levers-before-escalation`). the only lever here is your own attention |

## .the test — forced articulation, per review

for **each** review, before you promise it, answer on the page:

> **"what did I find, and what did I settle?"**

- a defect found → state how it was repaired
- a non-issue examined → state **why** it holds, with evidence
- **neither** → **you did not review. begin again** — and this is the whole rule in one line

🟡 **the third branch is the one that must not be softened.** *"i read it and it seemed fine"* is
the answer of an author, never of a reviewer. a self review is the one moment a driver stops as the
artifact's defender and reads as its severest critic.

## .why the ladder earns this

a self review is the **cheapest** review in the loop and the **only** one a driver can run without
spending another actor's attention:

- a peer review costs a peer's rounds (`rule.always.get-a-second-opinion-before-foreman`)
- an escalation costs the human's attention — the scarcest resource there is
- **a self review costs the driver alone**

⇒ so a driver that shortcuts the free review to reach the expensive ones has inverted the whole
economy the escalation ladder is built on. every defect found here is one that never reaches a
peer, and never reaches a human.

## .enforcement

- a self review promised with no honest articulation behind it = **blocker**
- an articulation that names neither a repair nor a reasoned hold = **blocker** — it is a file, not
  a review
- a promise made because the guard would let it through, rather than to report a review = **blocker**
- an ask to a human to waive, skip, or override a self review = **blocker** — there is no lever,
  and the ask spends their attention on what they cannot grant
- a self-review count that grew, reported as a **guard malfunction** = **blocker**
  (`rule.always.diagnose-reviewer-malfunctions` governs a broken reviewer; more work owed is not one)
- a self review **batched** — every repair held back until after the promise clears — = **blocker**.
  it was the rational adaptation to a clock that reset on each repair; that clock is gone, so the
  habit now costs the artifact and buys naught

## .see also

- `howto.run-self-reviews.[guide]` — the HOW: the flow, the computable path, `--into`, the
  freshness bar. this rule is the MANDATE that guide serves
- `rule.always.converge-to-terminal` — the peer ladder, which **does** have a budget and an
  honorable exhaustion. the contrast is the point
- `rule.always.spend-own-levers-before-escalation` — the same owner-sort: a self review is your
  lever and only ever yours
- `rule.always.get-a-second-opinion-before-foreman` — why the free review is spent before the
  costly ones
- `research.selfreview-effectiveness` (repo=.this) — the measured evidence that a review with a
  forced articulation outperforms one without
