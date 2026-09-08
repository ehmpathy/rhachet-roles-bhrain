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

## 🟡 .the guard has a liveness hatch. it is NOT a permission

`getSelfReviewChallengeDecision.ts`'s `attempts >= plowthroughThreshold` branch allows a promise once
attempts reach three on the same artifact hash, with no further timer. it exists so a driver is never **hard-stuck** by a clock.

🔴 **to aim for it is the shortcut this rule forbids.** three rapid promises will pass the guard and
will not have reviewed the artifact, and the guard cannot tell the difference — which is precisely
why the mandate binds the driver's conduct rather than the machinery's verdict.

> **what the guard permits and what you owe are two different quantities. only one of them is your
> business.**

the same holds one rung down: the guard checks that the articulation **file** is present and holds
real findings. a file that satisfies that check and reviewed naught satisfies the guard and
violates this rule.

## .the cues — when → then

| when… | then… |
|---|---|
| the self-review count **rises** rather than falls | 🔴 that is more work found, not a defect. carry it. do NOT diagnose the guard |
| you are about to ask a human to **waive** a self review | there is no lever to grant it. the ask spends their attention on what they cannot give |
| you promise the **same slug** a third time in quick succession | 🔴 you are about to hit the liveness hatch. stop and ask whether you reviewed at all |
| you write an articulation you could not defend to a peer | it is not an articulation. begin again |
| you catch yourself impatient with the 30-second timer | the timer is not the cost. the read is, and you have not paid it |
| a self review re-triggers after you **changed the artifact** | correct — the artifact you reviewed no longer exists. review the one that does |
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
- a promise made to reach the liveness hatch rather than to report a review = **blocker**
- an ask to a human to waive, skip, or override a self review = **blocker** — there is no lever,
  and the ask spends their attention on what they cannot grant
- a rising self-review count reported as a **guard malfunction** = **blocker**
  (`rule.always.diagnose-reviewer-malfunctions` governs a broken reviewer; more work owed is not one)
- a self review that re-triggers after the artifact changed = **false positive** — that is the
  ladder at work

## .see also

- `howto.run-self-reviews.[guide]` — the HOW: the flow, the exact path, the level pitfall. this
  rule is the MANDATE that guide serves
- `rule.always.converge-to-terminal` — the peer ladder, which **does** have a budget and an
  honorable exhaustion. the contrast is the point
- `rule.always.spend-own-levers-before-escalation` — the same owner-sort: a self review is your
  lever and only ever yours
- `rule.always.get-a-second-opinion-before-foreman` — why the free review is spent before the
  costly ones
- `research.selfreview-effectiveness` (repo=.this) — the measured evidence that a review with a
  forced articulation outperforms one without
