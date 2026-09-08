# rule.forbid.commits-the-route-did-not-ask-for

> **a driver commits when the route ASKS for a commit, or when the route is FINISHED.
> every other commit is forbidden — even the ones that look like hygiene.**

the route's unit of settlement is the **stone**, and a stone settles when its guard clears and the
driver runs `--as passed`. a commit made before that records a state **no guard accepted**.

## 🔴 .why — the commit is a REAL lever, and that is exactly the hazard

the naive read is that an early commit is mere impatience. it is not, and a rule written against
impatience will not bind, because the driver who reaches for it has a true and urgent reason:

> `rhx review` binds `--diffs since-main`. with **zero commits on the branch**, that range unions
> the entire staged **and** untracked set — so the reviewers read the whole branch, every round.

**measured on this branch:** ~293 files in scope, **9 of 11 lanes overflowed** their context window
and returned no verdict. a commit collapses that range at a stroke. it is the single most effective
move a driver has against an overflowed lane.

⇒ 🔴 **and that is the whole problem. it changes WHAT THE REVIEWERS CAN SEE, mid-review, by the hand
of the party under review.** the driver does not experience this as an evasion — the code is real,
the commit message is honest, the lanes stop to overflow. but the artifact set the next round grades
is one the driver chose, and no reviewer consented to the cut.

| the sanctioned answer to an overflowed lane | the unsanctioned ones |
|---|---|
| a **guard edit** — narrow that lane's `--paths-with` so it fits, then let the GUARD run it (`rule.always.diagnose-reviewer-malfunctions`) | a **commit** — narrow the diff itself · a **hand-run `rhx review`** — narrow the whole invocation (`rule.forbid.hand-run-reviews`) |
| the lane still runs on the guard's terms, costs its budget round, and mints a `.given` that gates | the engine never sees it: no budget drawn, no artifact read, no verdict that gates |

⇒ 🔴 **the two unsanctioned moves are the same defect at two scales.** a commit changes *what the
reviewers can see*; a hand-run review changes *who reviews and under what terms*. **both are a
review-scope change made by the party under review**, and both are attractive for the identical
reason — they work, they are free, and they feel like diligence.

**the second why is smaller and still holds:** *done* is a verdict the guard renders. a commit is the
driver's own record that the work is settled, and to write it first inverts the order the route exists
to impose.

## .the two sanctioned commits

| # | the warrant | how you check it |
|---|---|---|
| **1** | **the route asks** — a stone or its guard names a commit as a deliverable | read the `.stone` / `.guard` files. **name the stone**, or you have no warrant |
| **2** | **the route is finished** — every stone passed, and the last one approved | `rhx route.drive` reports no next stone |

⚠️ **quota is not a warrant.** `rule.always.spend-own-levers-before-escalation` files the commit quota
under **human**; this rule adds the half that rule does not carry — **even with quota in hand, the
route must ask.** a grant is scoped to what it was granted for, and *"they allowed one once"* is not
a permanent permission.

### 🔴 .and one booted rule said the opposite until 2026-09-07

`rule.always.raise-a-blocker-a-taken-cannot-close` closed its overflow section with *"that quota is a
legitimate `--as blocked`, and one of the cheapest asks a human ever receives."* **a driver read that,
halted on the quota, and the wisher struck the ask** — which is the incident this rule was written
from.

⇒ that section is now corrected and points here. **the correction is narrow, and worth the statement:
its arithmetic was never wrong.** a commit really is the only move that collapses `since-main`. what
it got wrong was that *human-gated* implies *worth a human's grant* — so it escalated for permission
to perform an act that stays forbidden once permitted.

⚠️ **a rule that names the right lever can still name the wrong ask.** the check is not *"who owns
this lever?"* but *"and once they hand it over, may I use it here?"*

## .the reasons that FEEL like warrants

each is true, and none is a warrant:

| the reason | why it is not one |
|---|---|
| 🔴 *"the diff overflows the lanes; a commit collapses it"* | the sharpest, because it is **correct**. see above — it is a review-scope change by the reviewed party |
| *"the work is done; I merely record it"* | **done** is the guard's word, not yours |
| *"a checkpoint, so the work is not lost"* | the worktree **is** the checkpoint. an uncommitted file is not at risk |
| *"CI needs a push to run"* | a release act. it belongs after approval, never before it |
| *"the tree is noisy and a commit would tidy it"* | tidiness of the tree is not a stone's deliverable |

## .the test

> **"which stone asked me to commit?"**

- you can **name it** → commit, and cite the stone in the message
- the route is **finished** → commit
- 🔴 you reach for a reason from the table above → **that is this rule at work.** do not commit

## ⚠️ .the bound — this governs the DRIVER on a route

a mechanic asked by a human to land a change works under a different contract
(`rule.require.git-release-confidence`, ehmpathy/mechanic). this rule binds the driver **while a route
is underway**, where the stone is what settles work and a commit is not a stone.

## .enforcement

blocker: a commit on a route no stone asked for and no approval finished · a commit reached for to
collapse an overflowed `since-main` range · a commit made on a prior quota with no stone that asks.

⇒ see also: `rule.always.spend-own-levers-before-escalation` (files the quota under **human**; this
adds that the route must ask too) · `rule.always.diagnose-reviewer-malfunctions` (the **scoped re-run**
that is the sanctioned answer to an overflowed lane) · `define.passage-statuses` (why only `passed`
settles a stone).
