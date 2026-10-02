# S5 — the switch preserves the conversation

## .said

> it preserves the conversation, no worries

⇒ in answer to open question #1: *does a `/model` switch preserve the conversation?*

## .settled

**a brain switch is a change of the ENGINE, never of the SESSION.** the conversation is the clone's
own state; the brain is what reads it. so a re-assert of the declared brain costs a redundant call
and forfeits no context.

⇒ **the redundant path is therefore BENIGN**, which is the clause
`rule.require.fewer-paths-via-idempotency` turns on:

> *"collapse of a branch whose unconditional worst case is not benign, without first making the
> operation safe = **blocker** (the branch carried real weight)."*

**the worst case is benign. so the branch carries no weight, and the rule's blocker fires the other
way** — a branch kept to skip a benign idempotent re-run is the defect.

🔴 **and one fact settles a whole class of design, not one branch.** where an operation's re-run is
benign, **every** compare-before-act in front of it is dead code — the comparison, its normalizer,
its two failure modes, and the state it must read to run at all.

⇒ so the question *"is a redundant call benign?"* belongs **before** any applier is designed, because
its answer deletes or justifies the whole read path behind it.

## 🟡 .what it does NOT settle

it answers the **cost** of a redundant dispatch and says naught about whether the dispatch was
**accepted**. a refused slug is still a refused slug — `case=3` is untouched.

## .landed

- `.fulcrums/inventory.of=fulcrums.case=F14-the-applier-converges-rather-than-compares.md`
- `1.vision.experience.case=6.the-brain-is-already-right.md`
- `1.vision.yield.md`
