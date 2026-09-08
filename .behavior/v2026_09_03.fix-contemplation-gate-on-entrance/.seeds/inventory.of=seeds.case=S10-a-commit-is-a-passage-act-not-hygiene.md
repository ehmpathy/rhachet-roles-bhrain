# seed S10 — a commit is a PASSAGE act, never hygiene

## .said — verbatim, 2026-09-07

> you do not need to commit yet. no noe approved your stone

> can we update the driver to enbrief that commits are never allowed unless the route explicitly
> says to commit? OR unless the route is explicitly finished ?

## .settled

**a driver commits when the route ASKS for a commit, or when the route is FINISHED. every other
commit is forbidden.**

the route's unit of settlement is the **stone** — it settles when its guard clears and the driver
runs `--as passed`, and the route finishes when the last stone is **approved**. a commit written
before either records a state **no guard accepted**.

| the warrant | the check |
|---|---|
| the route **asks** — a stone or its guard names a commit as a deliverable | read the `.stone` / `.guard`. **name the stone** |
| the route is **finished** — every stone passed, the last one approved | the drive reports no next stone |

⚠️ **quota is not a warrant.** a human grant of commit permission answers *"may you?"*; it does not
answer *"does the route ask?"* those are two questions, and a driver that conflates them treats one
grant as a permanent license.

## 🔴 .why it had to be said — the commit is a REAL lever, and that is the hazard

this is not a rule against impatience, and a rule written against impatience would not have bound.
the driver who reached for the commit had a true and urgent reason:

> a review binds its diff to `since-main`. with **zero commits on the branch**, that range unions the
> entire staged **and** untracked set — so every reviewer reads the whole branch, every round.

**measured on this drive:** ~293 files in scope, **9 of 11 lanes overflowed** their context window
and returned no verdict. a commit collapses that range at a stroke.

⇒ 🔴 **so the commit is the single most effective move against an overflowed lane — and it changes
WHAT THE REVIEWERS CAN SEE, mid-review, by the hand of the party under review.** it does not feel
like an evasion: the code is real, the message is honest, the lanes stop to overflow. but the
artifact set the next round grades is one the **driver** chose, and no reviewer consented to the cut.

| the sanctioned answer to an overflowed lane | the unsanctioned one |
|---|---|
| a **scoped re-run** — narrow the lane's paths, keep the diff bound | a **commit** — narrow the diff itself |
| the reviewer still sees the whole set; you chose the lens | the reviewer cannot see it at all; you chose the corpus |

## ⚠️ .what this corrected

the drive had named a commit quota as its **foremost** escalation ask, on the argument that it was
*"the only lever that shrinks `since-main`"*. that argument was correct about the mechanism and wrong
about the warrant — **effectiveness is not permission.** the ask is withdrawn, and the escape valve
for an overflowed lane is the scoped re-run the extant rules already name.

🔴 **and it corrected a booted rule, not merely a driver.** `rule.always.raise-a-blocker-a-taken-cannot-close`
closed its overflow section with *"that quota is a legitimate `--as blocked`, and one of the cheapest
asks a human ever receives."* ⇒ **the escalation was compliance with a `say`-tier brief**, so the
repair is at that brief's own line rather than a second rule that outranks it by recency.

⚠️ **the corrected step is one clause wide.** its arithmetic held — a commit really is the only move
that collapses `since-main`. the defect is the leap from *human-gated* to *worth a human's grant*.

## .landed

- `src/domain.roles/driver/briefs/rule.forbid.commits-the-route-did-not-ask-for.md` (+ `.md.min`)
- `src/domain.roles/driver/boot.yml` — `say` tier, beside the escalation family
- `src/domain.roles/driver/briefs/rule.always.raise-a-blocker-a-taken-cannot-close.md` (+ `.md.min`)
